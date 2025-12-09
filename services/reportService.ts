import { jsPDF } from "jspdf";

export const generateLabReport = async (
  protocol: string,
  analysisResult: string | null,
  imagePreview: string | null,
  baseFilename: string = "Experiment_Protocol"
) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  let yPos = 20;

  // -- HEADER (Bio-Glass Theme) --
  // Void Blue-Grey Background (#0F172A -> 15, 23, 42)
  doc.setFillColor(15, 23, 42); 
  doc.rect(0, 0, pageWidth, 40, 'F');

  // Neon Accent Line (Emerald #10B981 -> 16, 185, 129)
  doc.setDrawColor(16, 185, 129);
  doc.setLineWidth(1);
  doc.line(0, 39, pageWidth, 39);

  // Title
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("Lab Bench Co-Pilot", margin, 18);
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(148, 163, 184); // Slate-400
  doc.text("INCIDENT REPORT // VERIFIED BY GEMINI 3 PRO", margin, 26);

  // Date Badge
  doc.setDrawColor(148, 163, 184);
  doc.setLineWidth(0.1);
  doc.roundedRect(pageWidth - margin - 50, 12, 50, 16, 2, 2, 'S');
  doc.text(new Date().toLocaleDateString(), pageWidth - margin - 42, 23);

  yPos = 55;

  // -- EVIDENCE (Image) --
  doc.setTextColor(30, 41, 59); // Slate-800
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("A. EVIDENCE", margin, yPos);
  
  // Section Line
  doc.setDrawColor(226, 232, 240); // Slate-200
  doc.line(margin, yPos + 2, pageWidth - margin, yPos + 2);
  yPos += 15;

  if (imagePreview) {
    try {
        // Fetch blob and convert to base64
        const base64Img = await toBase64(imagePreview);
        
        // Detect MIME Type for correct compression (PNG vs JPEG)
        const mimeMatch = base64Img.match(/^data:(image\/[a-z]+);base64,/);
        const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg';
        const format = mimeType === 'image/png' ? 'PNG' : 'JPEG';

        const imgProps = doc.getImageProperties(base64Img);
        const imgWidth = 80; // Larger image
        const imgHeight = (imgProps.height * imgWidth) / imgProps.width;
        
        // Check if image fits
        if (yPos + imgHeight > pageHeight - margin - 40) {
            doc.addPage();
            yPos = 40;
        }

        // Image Frame
        doc.setDrawColor(203, 213, 225);
        doc.rect(margin - 1, yPos - 1, imgWidth + 2, imgHeight + 2);
        doc.addImage(base64Img, format, margin, yPos, imgWidth, imgHeight);
        
        // "Bio-Glass" Stamp in PDF
        const stampX = margin + imgWidth + 20;
        const stampY = yPos + 10;
        
        // Stamp Circle
        doc.setDrawColor(139, 92, 246); // Electric Violet (#8B5CF6 -> 139, 92, 246)
        doc.setLineWidth(1.5);
        doc.circle(stampX + 15, stampY + 15, 20);
        
        // Stamp Text
        doc.setTextColor(139, 92, 246);
        doc.setFontSize(10);
        doc.setFont("helvetica", "bold");
        doc.text("VERIFIED", stampX + 4, stampY + 14);
        doc.setFontSize(7);
        doc.text("SAFETY CHECK", stampX + 6, stampY + 22);

        yPos += Math.max(imgHeight, 40) + 20;
    } catch (e) {
        console.error("PDF Image Error", e);
        doc.setFontSize(10);
        doc.setTextColor(200,0,0);
        doc.text("[Image could not be loaded]", margin, yPos);
        yPos += 20;
    }
  } else {
      doc.setFontSize(10);
      doc.setTextColor(100,100,100);
      doc.text("[No image evidence provided]", margin, yPos);
      yPos += 20;
  }

  // -- DIAGNOSIS --
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("B. DIAGNOSIS", margin, yPos);
  
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, yPos + 2, pageWidth - margin, yPos + 2);
  yPos += 12;

  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  
  // Clean markdown
  const cleanAnalysis = (analysisResult || "No analysis provided.")
    .replace(/\*\*/g, "")
    .replace(/#/g, "")
    .replace(/corrected_protocol/g, "");

  const splitAnalysis = doc.splitTextToSize(cleanAnalysis, pageWidth - (margin * 2));
  
  if (yPos + (splitAnalysis.length * 5) > pageHeight - margin - 40) {
      doc.addPage();
      yPos = 40;
  }
  
  doc.text(splitAnalysis, margin, yPos);
  yPos += (splitAnalysis.length * 5) + 20;

  // -- FIXED PROTOCOL --
  if (yPos > pageHeight - 80) {
      doc.addPage();
      yPos = 40;
  }

  doc.setTextColor(30, 41, 59);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("C. OPTIMIZED PROTOCOL (v2)", margin, yPos);
  doc.setDrawColor(226, 232, 240);
  doc.line(margin, yPos + 2, pageWidth - margin, yPos + 2);
  yPos += 12;

  doc.setFont("courier", "normal");
  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);

  const protocolLines = doc.splitTextToSize(protocol, pageWidth - (margin * 2) - 10);
  
  // Dynamic height calculation
  const lineHeight = 4;
  const boxHeight = (protocolLines.length * lineHeight) + 16;
  
  // Check available space
  if (yPos + boxHeight > pageHeight - margin - 40) {
      doc.addPage();
      yPos = 40;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(30, 41, 59);
      doc.text("C. OPTIMIZED PROTOCOL (v2) - Continued", margin, yPos);
      yPos += 15;
      
      doc.setFont("courier", "normal");
      doc.setFontSize(9);
      doc.setTextColor(30, 41, 59);
  }

  // Protocol Box Background (Very light Slate)
  doc.setFillColor(248, 250, 252); 
  doc.setDrawColor(226, 232, 240);
  doc.rect(margin, yPos, pageWidth - (margin * 2), boxHeight, 'FD');
  
  doc.text(protocolLines, margin + 5, yPos + 10);
  
  // -- FOOTER (Bio-Glass Theme) --
  const pageCount = doc.getNumberOfPages();
  for(let i = 1; i <= pageCount; i++) {
      doc.setPage(i);
      
      // Footer Background (Slate-800 simulates glass)
      doc.setFillColor(30, 41, 59); 
      doc.rect(0, pageHeight - 20, pageWidth, 20, 'F');
      
      doc.setFont("helvetica", "italic");
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184); // Slate-400
      
      doc.text("Safety Verified by Petri AI", pageWidth - margin - 40, pageHeight - 8);
      doc.text(`Page ${i} of ${pageCount}`, margin, pageHeight - 8);
  }

  // Version Control Naming
  const cleanName = baseFilename.replace(/\.[^/.]+$/, "").replace(/[^a-zA-Z0-9-_]/g, "_");
  const finalName = `${cleanName}_v2_AI_Verified.pdf`;
  
  doc.save(finalName);
};

// Helper to get base64 from blob URL
async function toBase64(url: string): Promise<string> {
    const response = await fetch(url);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}