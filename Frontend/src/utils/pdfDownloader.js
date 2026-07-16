import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';

/**
 * Cross-platform PDF save helper.
 *
 * - **Web**: triggers a standard browser download via jsPDF's doc.save().
 * - **Android / iOS (Capacitor)**: writes the PDF to the device cache
 *   directory and opens the native share sheet so the user can save / send it.
 *
 * @param {import('jspdf').jsPDF} doc  – a fully-built jsPDF document instance
 * @param {string}                filename – desired file name, e.g. "report.pdf"
 * @param {object}                [opts]
 * @param {string}                [opts.shareTitle] – title shown on the share sheet
 * @param {string}                [opts.shareText]  – body text on the share sheet
 */
export async function savePdfCrossPlatform(doc, filename, opts = {}) {
  try {
    if (Capacitor.isNativePlatform()) {
      // ── Native (Android / iOS) ──────────────────────────────────────
      // Use Blob and FileReader for the most reliable base64 conversion
      const pdfBlob = doc.output('blob');

      const base64Data = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const res = reader.result;
          // Result is "data:application/pdf;base64,JVBER..."
          resolve(res.split(',')[1]);
        };
        reader.onerror = (err) => {
          console.error("FileReader error:", err);
          reject(new Error("Failed to read PDF blob"));
        };
        reader.readAsDataURL(pdfBlob);
      });

      // Write to Cache directory (temporary storage)
      const result = await Filesystem.writeFile({
        path: filename,
        data: base64Data,
        directory: Directory.Cache
      });

      // Share the file so the user can save it to their device or send it
      await Share.share({
        title: opts.shareTitle || 'Property Report',
        text: opts.shareText || 'Here is your Land Plot Boundary Report',
        url: result.uri,
      });

    } else {
      // ── Web browser ─────────────────────────────────────────────────
      doc.save(filename);
    }
  } catch (error) {
    console.error('CRITICAL: savePdfCrossPlatform failed:', error);
    throw new Error("Device failed to save PDF. Please try again.");
  }
}
