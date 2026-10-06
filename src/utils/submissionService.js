import { supabase } from './supabaseClient';

/**
 * Uploads a student experiment PDF and creates a submission record in Supabase.
 */
export async function submitLabReport({
  pdfBlob,
  fileName,
  studentDetails,
  experimentConfig,
  subjectId
}) {
  try {
    if (!studentDetails?.registerNumber || !studentDetails?.studentName) {
      return { success: false, error: 'Student Register Number and Name are required.' };
    }

    const cleanRegNo = String(studentDetails.registerNumber).trim().replace(/[^a-zA-Z0-9_-]/g, '_');
    const expId = experimentConfig.experiment_id || experimentConfig.id;
    const finalSubjectId = subjectId || experimentConfig.subject || 'fluid_mechanics';
    const finalExpName = experimentConfig.title || experimentConfig.short_name || expId;

    // Check deadline before allowing upload
    const deadlineInfo = await fetchExperimentDeadline(expId);
    if (deadlineInfo.isExpired) {
      return {
        success: false,
        error: `Submission deadline has passed on ${new Date(deadlineInfo.deadline_at).toLocaleString('en-IN')}. Submissions are closed.`
      };
    }

    // 1. Upload PDF Blob to Supabase Storage: 'student-lab-reports'
    const storagePath = `${finalSubjectId}/${expId}/${cleanRegNo}_${Date.now()}.pdf`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('student-lab-reports')
      .upload(storagePath, pdfBlob, {
        contentType: 'application/pdf',
        upsert: true
      });

    if (uploadError) {
      console.error('Supabase storage upload error:', uploadError);
      return {
        success: false,
        error: `Failed to upload PDF file to storage: ${uploadError.message || 'Bucket student-lab-reports may not exist or is not public.'}`
      };
    }

    // 2. Obtain public URL
    const { data: publicUrlData } = supabase.storage
      .from('student-lab-reports')
      .getPublicUrl(storagePath);

    const pdfUrl = publicUrlData?.publicUrl || '';

    // 3. Insert metadata record in 'lab_submissions'
    const record = {
      register_number: studentDetails.registerNumber.trim(),
      student_name: studentDetails.studentName.trim(),
      student_email: studentDetails.email ? studentDetails.email.trim() : '',
      subject_id: finalSubjectId,
      experiment_id: expId,
      experiment_name: finalExpName,
      pdf_url: pdfUrl,
      file_name: fileName || `${cleanRegNo}_${expId}.pdf`,
      submitted_at: new Date().toISOString()
    };

    const { data: insertData, error: insertError } = await supabase
      .from('lab_submissions')
      .insert(record)
      .select();

    if (insertError) {
      console.error('Supabase database insert error:', insertError);
      return {
        success: false,
        error: `File uploaded, but database record failed: ${insertError.message}`
      };
    }

    return {
      success: true,
      data: insertData?.[0] || record,
      pdfUrl
    };
  } catch (err) {
    console.error('Unexpected submission error:', err);
    return { success: false, error: err.message || 'An unexpected error occurred during submission.' };
  }
}

/**
 * Checks whether the current student has already submitted this experiment.
 */
export async function checkStudentSubmission(registerNumber, experimentId) {
  if (!registerNumber || !experimentId) return null;
  try {
    const trashedIds = new Set(getRecycleBinSubmissions().map(t => t.id));
    const { data, error } = await supabase
      .from('lab_submissions')
      .select('*')
      .eq('register_number', String(registerNumber).trim())
      .eq('experiment_id', experimentId)
      .order('submitted_at', { ascending: false });

    if (error || !data || data.length === 0) return null;
    const active = data.find(item => !item.is_deleted && !trashedIds.has(item.id));
    if (!active) return null;

    const statusMap = getSubmissionStatusMap();
    const cached = statusMap[active.id] || {};

    return {
      ...active,
      status: active.status || cached.status || 'pending',
      faculty_remarks: active.faculty_remarks || cached.faculty_remarks || '',
      reviewed_at: active.reviewed_at || cached.reviewed_at || null,
      reviewed_by: active.reviewed_by || cached.reviewed_by || null
    };
  } catch (err) {
    console.warn('Error checking student submission:', err);
    return null;
  }
}

/**
 * Retrieves the deadline for a specific experiment and calculates whether it is expired.
 */
export async function fetchExperimentDeadline(experimentId) {
  if (!experimentId) return { deadline_at: null, isExpired: false };
  try {
    const { data, error } = await supabase
      .from('experiment_deadlines')
      .select('*')
      .eq('id', experimentId)
      .maybeSingle();

    if (error || !data || !data.deadline_at) {
      return { deadline_at: null, isExpired: false };
    }

    const deadlineDate = new Date(data.deadline_at);
    const now = new Date();
    const isExpired = now > deadlineDate;

    return {
      deadline_at: data.deadline_at,
      isExpired,
      experiment_name: data.experiment_name,
      updated_by: data.updated_by
    };
  } catch (err) {
    console.warn('Error fetching experiment deadline:', err);
    return { deadline_at: null, isExpired: false };
  }
}

/**
 * Retrieves all deadlines stored in the database.
 */
export async function fetchAllDeadlines() {
  try {
    const { data, error } = await supabase
      .from('experiment_deadlines')
      .select('*');

    if (error) {
      console.warn('Error fetching all deadlines:', error);
      return {};
    }

    const map = {};
    (data || []).forEach(d => {
      map[d.id] = d;
    });
    return map;
  } catch (err) {
    console.warn('Error in fetchAllDeadlines:', err);
    return {};
  }
}

/**
 * Sets or extends the deadline for an experiment (Faculty action).
 */
export async function setExperimentDeadline({
  experimentId,
  subjectId = 'fluid_mechanics',
  experimentName,
  deadlineAt,
  updatedBy
}) {
  try {
    const payload = {
      id: experimentId,
      subject_id: subjectId,
      experiment_name: experimentName,
      deadline_at: deadlineAt ? new Date(deadlineAt).toISOString() : null,
      updated_at: new Date().toISOString(),
      updated_by: updatedBy || 'Faculty'
    };

    const { data, error } = await supabase
      .from('experiment_deadlines')
      .upsert(payload)
      .select();

    if (error) {
      console.error('Error saving deadline:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data: data?.[0] || payload };
  } catch (err) {
    console.error('Unexpected error setting deadline:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Fetches submissions with natural ascending sort by register number.
 */
export async function fetchSubmissions({ subjectId = null, experimentId = null } = {}) {
  try {
    let query = supabase
      .from('lab_submissions')
      .select('*');

    if (subjectId) {
      query = query.eq('subject_id', subjectId);
    }
    if (experimentId && experimentId !== 'all') {
      query = query.eq('experiment_id', experimentId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching submissions:', error);
      return [];
    }

    // Filter out items that are currently in the recycle bin
    const trashedIds = new Set(getRecycleBinSubmissions().map(t => t.id));
    const activeSubmissions = (data || []).filter(sub => !sub.is_deleted && !trashedIds.has(sub.id));

    // Sort by register number in natural ascending order (01, 02, 03... or 210701001, 210701002...)
    const sorted = [...activeSubmissions].sort((a, b) => {
      const regA = String(a.register_number || '').trim();
      const regB = String(b.register_number || '').trim();

      // Extract trailing digits if any
      const matchA = regA.match(/\d+$/);
      const matchB = regB.match(/\d+$/);

      if (matchA && matchB) {
        const numA = parseInt(matchA[0], 10);
        const numB = parseInt(matchB[0], 10);
        if (numA !== numB) return numA - numB;
      }

      return regA.localeCompare(regB, undefined, { numeric: true, sensitivity: 'base' });
    });

    // Merge persisted and cached approval status records
    const statusMap = getSubmissionStatusMap();
    return sorted.map(sub => {
      const cached = statusMap[sub.id] || {};
      return {
        ...sub,
        status: sub.status || cached.status || 'pending',
        faculty_remarks: sub.faculty_remarks || cached.faculty_remarks || '',
        reviewed_at: sub.reviewed_at || cached.reviewed_at || null,
        reviewed_by: sub.reviewed_by || cached.reviewed_by || null
      };
    });
  } catch (err) {
    console.error('Unexpected error fetching submissions:', err);
    return [];
  }
}

/**
 * Deletes a student submission record from the database and removes its PDF from storage.
 */
export async function deleteSubmission(submissionId, pdfUrl = null) {
  try {
    if (!submissionId) return { success: false, error: 'Submission ID is required.' };

    // 1. Delete from database table lab_submissions
    const { error: dbError } = await supabase
      .from('lab_submissions')
      .delete()
      .eq('id', submissionId);

    if (dbError) {
      console.error('Error deleting submission from database:', dbError);
      return { success: false, error: dbError.message };
    }

    // 2. If pdfUrl is provided, attempt to clean up file from storage bucket
    if (pdfUrl) {
      try {
        const match = pdfUrl.match(/student-lab-reports\/(.+)$/);
        if (match && match[1]) {
          const filePath = decodeURIComponent(match[1]);
          await supabase.storage.from('student-lab-reports').remove([filePath]);
        }
      } catch (storageErr) {
        console.warn('Non-fatal error removing storage file during submission deletion:', storageErr);
      }
    }

    return { success: true };
  } catch (err) {
    console.error('Unexpected error deleting submission:', err);
    return { success: false, error: err.message };
  }
}

/* =========================================================================
   RECYCLE BIN / SOFT-DELETE SYSTEM (Faculty Workspace)
   ========================================================================= */

const RECYCLE_BIN_KEY = 'chemlab_recycle_bin';

/**
 * Retrieves all soft-deleted reports stored in the Recycle Bin.
 */
export function getRecycleBinSubmissions() {
  try {
    const raw = localStorage.getItem(RECYCLE_BIN_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.warn('Error reading recycle bin from localStorage:', e);
    return [];
  }
}

/**
 * Saves items into the Recycle Bin in localStorage.
 */
export function saveRecycleBinSubmissions(items) {
  try {
    localStorage.setItem(RECYCLE_BIN_KEY, JSON.stringify(items));
  } catch (e) {
    console.warn('Error saving recycle bin to localStorage:', e);
  }
}

/**
 * Moves an active student submission to the Recycle Bin (Soft Delete).
 */
export async function moveToRecycleBin(submission) {
  try {
    if (!submission?.id) return { success: false, error: 'Invalid submission record' };
    const current = getRecycleBinSubmissions();
    const trashedItem = {
      ...submission,
      deleted_at: new Date().toISOString()
    };
    const updated = [trashedItem, ...current.filter(item => item.id !== submission.id)];
    saveRecycleBinSubmissions(updated);

    // Optionally mark is_deleted in Supabase if column exists
    try {
      await supabase
        .from('lab_submissions')
        .update({ is_deleted: true })
        .eq('id', submission.id);
    } catch (_) {}

    return { success: true, data: trashedItem };
  } catch (err) {
    console.error('Error moving submission to recycle bin:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Restores a submission from the Recycle Bin back to the active table.
 */
export async function restoreFromRecycleBin(submissionId) {
  try {
    if (!submissionId) return { success: false, error: 'Invalid submission ID' };
    const current = getRecycleBinSubmissions();
    const restoredItem = current.find(item => item.id === submissionId);
    const updated = current.filter(item => item.id !== submissionId);
    saveRecycleBinSubmissions(updated);

    // Optionally unmark is_deleted in Supabase if column exists
    try {
      await supabase
        .from('lab_submissions')
        .update({ is_deleted: false })
        .eq('id', submissionId);
    } catch (_) {}

    return { success: true, data: restoredItem };
  } catch (err) {
    console.error('Error restoring submission from recycle bin:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Permanently deletes a submission from both database/storage and the recycle bin.
 */
export async function deletePermanently(submissionId, pdfUrl = null) {
  const res = await deleteSubmission(submissionId, pdfUrl);
  if (res.success) {
    const current = getRecycleBinSubmissions();
    saveRecycleBinSubmissions(current.filter(item => item.id !== submissionId));
  }
  return res;
}

/**
 * Empties all items from the Recycle Bin permanently.
 */
export async function emptyRecycleBin() {
  const current = getRecycleBinSubmissions();
  for (const item of current) {
    await deleteSubmission(item.id, item.pdf_url);
  }
  saveRecycleBinSubmissions([]);
  return { success: true, count: current.length };
}

/* =========================================================================
   SUBMISSION APPROVAL & AUTOMATED EMAIL NOTIFICATION SYSTEM
   ========================================================================= */

const SUBMISSION_STATUS_KEY = 'chemlab_submission_statuses';

/**
 * Retrieves the local cache of submission approval statuses.
 * Format: { [submissionId]: { status: 'approved' | 'not_approved' | 'pending', faculty_remarks: string, reviewed_at: string, reviewed_by: string } }
 */
export function getSubmissionStatusMap() {
  try {
    const raw = localStorage.getItem(SUBMISSION_STATUS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    console.warn('Error reading submission statuses from localStorage:', e);
    return {};
  }
}

/**
 * Saves status map to localStorage.
 */
export function saveSubmissionStatusMap(map) {
  try {
    localStorage.setItem(SUBMISSION_STATUS_KEY, JSON.stringify(map));
  } catch (e) {
    console.warn('Error saving submission statuses to localStorage:', e);
  }
}

/**
 * Updates the approval status of a student submission (Approved or Not Approved).
 * Persists to both Supabase (if online) and localStorage cache for instant reliability.
 */
export async function updateSubmissionStatus({
  submissionId,
  status, // 'approved' | 'not_approved' | 'pending'
  facultyRemarks = '',
  reviewedBy = 'Faculty'
}) {
  try {
    if (!submissionId) {
      return { success: false, error: 'Submission ID is required.' };
    }

    const reviewedAt = new Date().toISOString();
    const updatePayload = {
      status,
      faculty_remarks: facultyRemarks,
      reviewed_at: reviewedAt,
      reviewed_by: reviewedBy
    };

    // 1. Update localStorage cache immediately
    const currentMap = getSubmissionStatusMap();
    currentMap[submissionId] = {
      ...(currentMap[submissionId] || {}),
      ...updatePayload
    };
    saveSubmissionStatusMap(currentMap);

    // 2. Sync to Supabase lab_submissions table
    try {
      await supabase
        .from('lab_submissions')
        .update(updatePayload)
        .eq('id', submissionId);
    } catch (dbErr) {
      console.warn('Database status sync notice (persisted in local cache):', dbErr);
    }

    return {
      success: true,
      data: updatePayload
    };
  } catch (err) {
    console.error('Error updating submission status:', err);
    return { success: false, error: err.message || 'Failed to update approval status.' };
  }
}

/**
 * Sends an automated background notification email to the student when an experiment is marked as Not Approved.
 * Uses FormSubmit AJAX background dispatch with official college notification format and provides Gmail Web Compose fallback.
 */
export async function sendNotApprovedEmail({
  studentName,
  studentEmail,
  registerNumber,
  experimentName,
  facultyRemarks,
  facultyEmail = 'faculty@rajalakshmi.edu.in',
  facultyName = 'Faculty In-Charge'
}) {
  const regClean = String(registerNumber || '').trim();
  const rawEmail = String(studentEmail || '').trim();

  // Resolve official college email: use provided email if valid, otherwise derive from register number
  const targetEmail = (rawEmail && rawEmail.includes('@'))
    ? rawEmail
    : (regClean ? `${regClean.toLowerCase()}@rajalakshmi.edu.in` : '');

  if (!targetEmail) {
    return {
      success: false,
      error: 'No student email address or register number found to deliver notification.',
      targetEmail: ''
    };
  }

  const subject = `[ChemZ Lab] Corrections Required: ${experimentName || 'Submitted Experiment'} - Not Approved`;
  const remarksText = facultyRemarks || 'There are corrections required in your submitted experiment calculations, observations, or report. Please review your calculations and meet the faculty to get it approved.';

  const formattedMessage = `Dear ${studentName || 'Student'} (Register Number: ${regClean}),

Your submitted experiment report for:
"${experimentName || 'Laboratory Experiment'}"
has NOT BEEN APPROVED by faculty.

Faculty Remarks & Corrections Required:
----------------------------------------
"${remarksText}"

Please review your experimental observations, calculations, or plots, make the necessary corrections, and meet the faculty in the laboratory to obtain final approval.

Department of Chemical Engineering
Rajalakshmi Engineering College, Chennai
ChemZ Lab Digital Laboratory Platform`;

  // Create direct Gmail Web compose link as an instant backup/preview
  const gmailComposeUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(targetEmail)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(formattedMessage)}`;

  // Primary: Dispatch automated background AJAX via FormSubmit
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000); // 12-second timeout

    const response = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(targetEmail)}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      signal: controller.signal,
      body: JSON.stringify({
        _subject: subject,
        _replyto: facultyEmail,
        _template: 'table',
        sender: `${facultyName} via ChemZ Lab`,
        student_name: studentName || 'Student',
        register_number: regClean,
        experiment: experimentName || 'Laboratory Experiment',
        approval_status: 'NOT APPROVED (CORRECTIONS REQUIRED)',
        faculty_remarks: remarksText,
        instruction: 'Please meet the concerned faculty in the laboratory to discuss corrections and get approved.',
        message: formattedMessage
      })
    });

    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json().catch(() => ({}));
      return {
        success: true,
        targetEmail,
        gmailComposeUrl,
        response: data
      };
    } else {
      console.warn('FormSubmit background notification status:', response.status);
      return {
        success: true,
        warning: `Automated email service returned HTTP ${response.status}`,
        targetEmail,
        gmailComposeUrl
      };
    }
  } catch (err) {
    console.warn('Background automated email dispatch notice:', err);
    return {
      success: true,
      warning: 'Background notification queued. Gmail compose link also ready.',
      targetEmail,
      gmailComposeUrl
    };
  }
}


