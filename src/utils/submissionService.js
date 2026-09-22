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
    const { data, error } = await supabase
      .from('lab_submissions')
      .select('*')
      .eq('register_number', String(registerNumber).trim())
      .eq('experiment_id', experimentId)
      .order('submitted_at', { ascending: false })
      .limit(1);

    if (error || !data || data.length === 0) return null;
    return data[0];
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

    // Sort by register number in natural ascending order (01, 02, 03... or 210701001, 210701002...)
    const sorted = [...(data || [])].sort((a, b) => {
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

    return sorted;
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

