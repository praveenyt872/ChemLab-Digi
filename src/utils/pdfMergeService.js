import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

/**
 * Extracts and sorts student submissions according to the experiment number
 * entered/assigned by the student (e.g., Exp 1, Exp 2, Exp 3...), or by submission time.
 */
export function sortStudentSubmissionsByExpNumber(submissions = []) {
  return [...submissions].sort((a, b) => {
    const getExpNum = (sub) => {
      // 1. Check file_name pattern (e.g. Fluid_Mechanics_Exp_3_210701001.pdf)
      const matchFile = (sub.file_name || '').match(/Exp_(\d+)/i);
      if (matchFile) return parseInt(matchFile[1], 10);

      // 2. Check experiment_name prefix (e.g. "1. Calibration of Rotameter")
      const matchName = (sub.experiment_name || '').match(/^(\d+)/);
      if (matchName) return parseInt(matchName[1], 10);

      return 999;
    };

    const numA = getExpNum(a);
    const numB = getExpNum(b);

    if (numA !== numB) return numA - numB;

    // Fallback: order by submission timestamp
    const dateA = new Date(a.submitted_at || 0).getTime();
    const dateB = new Date(b.submitted_at || 0).getTime();
    return dateA - dateB;
  });
}

/**
 * Creates an institutional Title / Cover Page for the combined lab record.
 */
async function addCoverPage(mergedPdf, { studentName, registerNumber, submissionsCount, sortedSubmissions }) {
  try {
    const page = mergedPdf.addPage([595.28, 841.89]); // Standard A4 (Points)
    const fontBold = await mergedPdf.embedFont(StandardFonts.HelveticaBold);
    const fontRegular = await mergedPdf.embedFont(StandardFonts.Helvetica);
    const fontOblique = await mergedPdf.embedFont(StandardFonts.HelveticaOblique);

    const width = page.getWidth();
    const height = page.getHeight();

    // Border Frame
    page.drawRectangle({
      x: 25,
      y: 25,
      width: width - 50,
      height: height - 50,
      borderColor: rgb(0.48, 0.25, 0.73), // Violet / Purple accent
      borderWidth: 2
    });

    page.drawRectangle({
      x: 29,
      y: 29,
      width: width - 58,
      height: height - 58,
      borderColor: rgb(0.85, 0.85, 0.90),
      borderWidth: 0.8
    });

    let currentY = height - 80;

    // College Header
    const collegeTitle = 'RAJALAKSHMI ENGINEERING COLLEGE';
    const titleWidth = fontBold.widthOfTextAtSize(collegeTitle, 16);
    page.drawText(collegeTitle, {
      x: (width - titleWidth) / 2,
      y: currentY,
      size: 16,
      font: fontBold,
      color: rgb(0.1, 0.1, 0.2)
    });

    currentY -= 20;
    const subHeader = 'An Autonomous Institution | Affiliated to Anna University, Chennai';
    const subWidth = fontRegular.widthOfTextAtSize(subHeader, 10);
    page.drawText(subHeader, {
      x: (width - subWidth) / 2,
      y: currentY,
      size: 10,
      font: fontRegular,
      color: rgb(0.4, 0.4, 0.45)
    });

    currentY -= 16;
    const deptHeader = 'DEPARTMENT OF CHEMICAL ENGINEERING';
    const deptWidth = fontBold.widthOfTextAtSize(deptHeader, 11);
    page.drawText(deptHeader, {
      x: (width - deptWidth) / 2,
      y: currentY,
      size: 11,
      font: fontBold,
      color: rgb(0.35, 0.15, 0.6)
    });

    // Divider Line
    currentY -= 24;
    page.drawLine({
      start: { x: 50, y: currentY },
      end: { x: width - 50, y: currentY },
      thickness: 1.5,
      color: rgb(0.48, 0.25, 0.73)
    });

    // Record Title
    currentY -= 50;
    const recordTitle = 'COMPLETE LABORATORY RECORD';
    const recWidth = fontBold.widthOfTextAtSize(recordTitle, 18);
    page.drawText(recordTitle, {
      x: (width - recWidth) / 2,
      y: currentY,
      size: 18,
      font: fontBold,
      color: rgb(0.08, 0.08, 0.15)
    });

    currentY -= 22;
    const subjectTitle = 'CH19311 — FLUID MECHANICS LABORATORY';
    const subTWidth = fontBold.widthOfTextAtSize(subjectTitle, 13);
    page.drawText(subjectTitle, {
      x: (width - subTWidth) / 2,
      y: currentY,
      size: 13,
      font: fontBold,
      color: rgb(0.48, 0.25, 0.73)
    });

    // Student Details Box
    currentY -= 65;
    page.drawRectangle({
      x: 60,
      y: currentY - 50,
      width: width - 120,
      height: 70,
      color: rgb(0.97, 0.96, 0.99),
      borderColor: rgb(0.85, 0.80, 0.95),
      borderWidth: 1
    });

    page.drawText('STUDENT RECORD CREDENTIALS', {
      x: 75,
      y: currentY + 4,
      size: 9,
      font: fontBold,
      color: rgb(0.48, 0.25, 0.73)
    });

    page.drawText(`Student Name:`, { x: 75, y: currentY - 14, size: 10, font: fontBold, color: rgb(0.2, 0.2, 0.25) });
    page.drawText(`${studentName}`, { x: 175, y: currentY - 14, size: 10, font: fontRegular, color: rgb(0.1, 0.1, 0.1) });

    page.drawText(`Register Number:`, { x: 75, y: currentY - 30, size: 10, font: fontBold, color: rgb(0.2, 0.2, 0.25) });
    page.drawText(`${registerNumber}`, { x: 175, y: currentY - 30, size: 10, font: fontBold, color: rgb(0.35, 0.15, 0.6) });

    page.drawText(`Total Experiments:`, { x: 75, y: currentY - 46, size: 10, font: fontBold, color: rgb(0.2, 0.2, 0.25) });
    page.drawText(`${submissionsCount} Completed`, { x: 175, y: currentY - 46, size: 10, font: fontRegular, color: rgb(0.1, 0.5, 0.25) });

    // Table of Contents Section
    currentY -= 85;
    page.drawText('INDEX OF COMPILED EXPERIMENTS', {
      x: 60,
      y: currentY,
      size: 11,
      font: fontBold,
      color: rgb(0.1, 0.1, 0.2)
    });

    currentY -= 12;
    page.drawLine({
      start: { x: 60, y: currentY },
      end: { x: width - 60, y: currentY },
      thickness: 1,
      color: rgb(0.7, 0.7, 0.8)
    });

    // Table rows
    currentY -= 18;
    sortedSubmissions.forEach((sub, idx) => {
      if (currentY < 90) return; // avoid overflow

      // Get student's experiment number or sequential index
      const matchFile = (sub.file_name || '').match(/Exp_(\d+)/i);
      const expNum = matchFile ? matchFile[1] : (idx + 1);

      const expLabel = `Ex. ${expNum}`;
      page.drawText(expLabel, {
        x: 60,
        y: currentY,
        size: 9,
        font: fontBold,
        color: rgb(0.48, 0.25, 0.73)
      });

      const expTitle = sub.experiment_name || sub.experiment_id || 'Experiment';
      const truncatedTitle = expTitle.length > 55 ? expTitle.substring(0, 52) + '...' : expTitle;
      page.drawText(truncatedTitle, {
        x: 105,
        y: currentY,
        size: 9,
        font: fontRegular,
        color: rgb(0.2, 0.2, 0.25)
      });

      const dateStr = sub.submitted_at
        ? new Date(sub.submitted_at).toLocaleDateString('en-IN')
        : 'Submitted';
      page.drawText(dateStr, {
        x: width - 130,
        y: currentY,
        size: 8.5,
        font: fontOblique,
        color: rgb(0.45, 0.45, 0.5)
      });

      currentY -= 18;
    });

    // Footer Accreditation Note
    const footerText = 'Digitally Generated and Verified via LabFlow AI — Chemical Engineering Virtual Laboratory';
    const footWidth = fontRegular.widthOfTextAtSize(footerText, 8);
    page.drawText(footerText, {
      x: (width - footWidth) / 2,
      y: 40,
      size: 8,
      font: fontRegular,
      color: rgb(0.5, 0.5, 0.55)
    });

  } catch (err) {
    console.warn('Could not generate cover page, proceeding with merged report pages only:', err);
  }
}

/**
 * Combines all submitted experiment PDFs for a student into a single unified record PDF.
 * Arranged strictly by the experiment number entered/performed by the student (1, 2, 3...).
 *
 * @param {Object} options
 * @param {string} options.studentName - Full student name
 * @param {string} options.registerNumber - Student register number
 * @param {Array} options.submissions - Array of submission objects (with pdf_url)
 * @param {Function} options.onProgress - Optional callback ({ current, total, status })
 * @returns {Promise<{ success: boolean, fileName: string, error?: string }>}
 */
export async function combineStudentExperimentPdfs({
  studentName,
  registerNumber,
  submissions = [],
  onProgress = () => {}
}) {
  try {
    if (!submissions || submissions.length === 0) {
      return { success: false, error: 'No submissions found to combine.' };
    }

    // 1. Sort submissions according to the experiment number given by the student (Exp 1, Exp 2, ...)
    const sorted = sortStudentSubmissionsByExpNumber(submissions);
    const validWithUrls = sorted.filter(s => !!s.pdf_url);

    if (validWithUrls.length === 0) {
      return { success: false, error: 'No PDF URLs available in the submitted records.' };
    }

    onProgress({ current: 0, total: validWithUrls.length, status: 'Initializing merged document...' });

    // 2. Create the unified PDF document
    const mergedPdf = await PDFDocument.create();

    // 3. Add Cover Page
    await addCoverPage(mergedPdf, {
      studentName: studentName || 'Student',
      registerNumber: registerNumber || 'Record',
      submissionsCount: validWithUrls.length,
      sortedSubmissions: validWithUrls
    });

    // 4. Fetch and append each experiment PDF in order
    for (let i = 0; i < validWithUrls.length; i++) {
      const sub = validWithUrls[i];
      const matchFile = (sub.file_name || '').match(/Exp_(\d+)/i);
      const expNum = matchFile ? matchFile[1] : (i + 1);
      const expTitle = sub.experiment_name || sub.experiment_id || `Experiment ${expNum}`;

      onProgress({
        current: i + 1,
        total: validWithUrls.length,
        status: `Combining Ex. ${expNum}: ${expTitle}...`
      });

      try {
        const response = await fetch(sub.pdf_url, { mode: 'cors' });
        if (!response.ok) {
          throw new Error(`HTTP error ${response.status} when fetching PDF`);
        }

        const arrayBuffer = await response.arrayBuffer();
        const sourcePdf = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
        const copiedPages = await mergedPdf.copyPages(sourcePdf, sourcePdf.getPageIndices());

        copiedPages.forEach((page) => mergedPdf.addPage(page));
      } catch (fetchErr) {
        console.warn(`Failed to merge PDF for ${sub.experiment_name || sub.experiment_id}:`, fetchErr);
        // Continue merging remaining experiments rather than completely aborting
      }
    }

    onProgress({ current: validWithUrls.length, total: validWithUrls.length, status: 'Finalizing compiled document...' });

    // 5. Save the combined PDF
    const mergedPdfBytes = await mergedPdf.save();

    // 6. Trigger client-side download
    const cleanRegNo = String(registerNumber || 'Student').trim().replace(/[^a-zA-Z0-9_-]/g, '_');
    const cleanName = String(studentName || 'Record').trim().replace(/[^a-zA-Z0-9_-]/g, '_');
    const finalFileName = `${cleanRegNo}_${cleanName}_Complete_Lab_Record_${validWithUrls.length}_Experiments.pdf`;

    const blob = new Blob([mergedPdfBytes], { type: 'application/pdf' });
    const blobUrl = URL.createObjectURL(blob);

    const downloadLink = document.createElement('a');
    downloadLink.href = blobUrl;
    downloadLink.download = finalFileName;
    document.body.appendChild(downloadLink);
    downloadLink.click();
    document.body.removeChild(downloadLink);

    setTimeout(() => {
      URL.revokeObjectURL(blobUrl);
    }, 10000);

    onProgress({ current: validWithUrls.length, total: validWithUrls.length, status: 'Download started!' });

    return {
      success: true,
      fileName: finalFileName,
      count: validWithUrls.length
    };
  } catch (err) {
    console.error('Error combining experiment PDFs:', err);
    return {
      success: false,
      error: err.message || 'An unexpected error occurred while combining the PDFs.'
    };
  }
}
