import { useState, useRef } from "react";
import { motion } from "motion/react";
import { Download, Share2, Building2, MapPin, Plus, Minus, Car } from "lucide-react";
import { WheelPicker } from "./components/WheelPicker";
import { formatINR, cn } from "./lib/utils";
import { FLOOR_PRICING, UNIT_SIZES, ADDITIONAL_CHARGES, BASE_PRICE } from "./lib/constants";
import { toPng } from "html-to-image";
import jsPDF from "jspdf";

declare global {
  interface Window {
    FlutterBridge?: any;
  }
}

export default function App() {
  const [selectedFloor, setSelectedFloor] = useState(FLOOR_PRICING[0].floor);
  const [selectedSize, setSelectedSize] = useState(UNIT_SIZES[0].value);
  const [isCorner, setIsCorner] = useState(false);
  const [parkingCount, setParkingCount] = useState(1);
  const resultRef = useRef<HTMLDivElement>(null);
  const pdfTemplateRef = useRef<HTMLDivElement>(null);

  const floorData = FLOOR_PRICING.find((f) => f.floor === selectedFloor)!;
  const floorPrice = floorData.price;
  
  const bspCost = selectedSize * BASE_PRICE;
  const plcCost = selectedSize * (floorPrice - BASE_PRICE);
  const cornerCost = isCorner ? selectedSize * ADDITIONAL_CHARGES.CORNER_PLC_PER_SQFT : 0;
  const eecFfcCost = selectedSize * ADDITIONAL_CHARGES.EEC_FFC_PER_SQFT;
  const ifmsCost = selectedSize * ADDITIONAL_CHARGES.IFMS_PER_SQFT;
  const parkingCost = parkingCount * ADDITIONAL_CHARGES.CAR_PARKING;
  
  const totalCost = 
    bspCost + 
    plcCost + 
    cornerCost + 
    eecFfcCost + 
    ifmsCost + 
    parkingCost + 
    ADDITIONAL_CHARGES.CLUB_MEMBERSHIP;

  const generatePDF = async (): Promise<jsPDF | null> => {
    if (!pdfTemplateRef.current) return null;
    try {
      const dataUrl = await toPng(pdfTemplateRef.current, {
        pixelRatio: 2,
        backgroundColor: "#ffffff",
        style: { margin: "0" },
      });
      
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      
      pdf.addImage(dataUrl, "PNG", 0, 0, pdfWidth, pdfHeight);
      return pdf;
    } catch (error) {
      console.error("Error generating PDF", error);
      return null;
    }
  };

  const handleDownloadPDF = async () => {
    const pdf = await generatePDF();
    if (pdf) {
      // Check for Flutter WebView bridge
      if (window.FlutterBridge) {
        const base64 = pdf.output("datauristring");
        window.FlutterBridge.postMessage(JSON.stringify({ type: 'DOWNLOAD_PDF', data: base64, filename: `Trevana_Residences_Quote_${selectedSize}sqft.pdf` }));
        return;
      }

      // Use Blob for web download to prevent data URI length limits (corrupted files)
      const blob = pdf.output("blob");
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Trevana_Residences_Quote_${selectedSize}sqft.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };

  const handleShare = async () => {
    const text = `*Trevana Residences Quote*
Floor: ${floorData.label}
Unit Size: ${selectedSize} sq.ft
Total Cost: ${formatINR(totalCost)}

*Breakdown:*
BSP: ${formatINR(bspCost)}
Floor PLC: ${formatINR(plcCost)}
${isCorner ? `Corner PLC: ${formatINR(cornerCost)}\n` : ""}EEC & FFC: ${formatINR(eecFfcCost)}
IFMS: ${formatINR(ifmsCost)}
Car Parking (${parkingCount}): ${formatINR(parkingCost)}
Club Membership: ${formatINR(ADDITIONAL_CHARGES.CLUB_MEMBERSHIP)}`;

    try {
      const pdf = await generatePDF();
      if (!pdf) return;
      
      // Check for Flutter WebView bridge
      if (window.FlutterBridge) {
        const base64 = pdf.output("datauristring");
        window.FlutterBridge.postMessage(JSON.stringify({ 
          type: 'SHARE_PDF', 
          data: base64, 
          text: `Karyan Cost Sheet ${formatINR(totalCost)}`,
          filename: `Trevana_Quote_${selectedSize}sqft.pdf`
        }));
        return;
      }

      const blob = pdf.output("blob");

      // Try to share the file if the browser supports it
      if (navigator.canShare) {
        const file = new File([blob], `Trevana_Quote_${selectedSize}sqft.pdf`, { type: "application/pdf" });
        
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: "Trevana Residences Quote",
            text: `Karyan Cost Sheet ${formatINR(totalCost)}`,
            files: [file]
          });
          return;
        }
      }

      // Fallback to text share if file sharing is not supported
      if (navigator.share) {
        await navigator.share({
          title: "Trevana Residences Quote",
          text: text,
        });
      } else {
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
      }
    } catch (error) {
      console.error("Error sharing", error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-600 font-sans selection:bg-amber-500/30">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-amber-400 to-amber-600 rounded-lg flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">KARYAN</h1>
              <p className="text-xs font-medium tracking-widest text-amber-600 uppercase">Trevana Residences</p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
          
          {/* Left Column: Controls */}
          <div className="lg:col-span-5 space-y-8">
            <div>
              <h2 className="text-2xl font-light text-slate-900 mb-2">Configure Unit</h2>
              <p className="text-sm text-slate-500">Select your preferred floor and unit size to generate a detailed cost breakdown.</p>
            </div>

            <div className="space-y-6">
              {/* Floor Selector */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-slate-700 uppercase tracking-wider">Select Floor</label>
                  <span className="text-xs font-mono text-amber-600 bg-amber-100 px-2 py-1 rounded">
                    {formatINR(floorPrice)} / sq.ft
                  </span>
                </div>
                <WheelPicker
                  items={FLOOR_PRICING.map(f => ({ label: f.label, value: f.floor }))}
                  value={selectedFloor}
                  onChange={setSelectedFloor}
                  height={220}
                  itemHeight={44}
                />
              </div>

              {/* Unit Size Selector */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-slate-700 uppercase tracking-wider">Unit Size</label>
                  <span className="text-xs font-mono text-slate-600 bg-slate-200 px-2 py-1 rounded">
                    {selectedSize} sq.ft
                  </span>
                </div>
                <WheelPicker
                  items={UNIT_SIZES}
                  value={selectedSize}
                  onChange={setSelectedSize}
                  height={180}
                  itemHeight={44}
                />
              </div>

              {/* Corner Unit Toggle */}
              <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-between cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => setIsCorner(!isCorner)}>
                <div className="flex items-center gap-3">
                  <div className={cn("w-10 h-10 rounded-full flex items-center justify-center transition-colors", isCorner ? "bg-amber-100 text-amber-600" : "bg-slate-100 text-slate-400")}>
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-medium text-slate-900">Corner Unit</h3>
                    <p className="text-xs text-slate-500">+ {formatINR(ADDITIONAL_CHARGES.CORNER_PLC_PER_SQFT)} / sq.ft</p>
                  </div>
                </div>
                <div className={cn("w-12 h-6 rounded-full p-1 transition-colors duration-300 ease-in-out", isCorner ? "bg-amber-500" : "bg-slate-300")}>
                  <motion.div 
                    className="w-4 h-4 bg-white rounded-full shadow-sm"
                    animate={{ x: isCorner ? 24 : 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                </div>
              </div>

              {/* Parking Counter */}
              <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center">
                    <Car className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-medium text-slate-900">Car Parking</h3>
                    <p className="text-xs text-slate-500">{formatINR(ADDITIONAL_CHARGES.CAR_PARKING)} each</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-slate-50 rounded-lg p-1 border border-slate-200">
                  <button 
                    onClick={() => setParkingCount(Math.max(0, parkingCount - 1))}
                    className="w-8 h-8 flex items-center justify-center rounded-md bg-white text-slate-600 shadow-sm border border-slate-200 hover:text-slate-900 hover:bg-slate-50 disabled:opacity-50"
                    disabled={parkingCount === 0}
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-4 text-center font-medium text-slate-900">{parkingCount}</span>
                  <button 
                    onClick={() => setParkingCount(parkingCount + 1)}
                    className="w-8 h-8 flex items-center justify-center rounded-md bg-white text-slate-600 shadow-sm border border-slate-200 hover:text-slate-900 hover:bg-slate-50"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>

            </div>
          </div>

          {/* Right Column: Result */}
          <div className="lg:col-span-7">
            <div className="sticky top-28 space-y-6">
              <div 
                ref={resultRef}
                className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 shadow-xl relative overflow-hidden"
              >
                {/* Decorative background elements */}
                <div data-html2canvas-ignore className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
                <div data-html2canvas-ignore className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/3 pointer-events-none" />
                
                <div className="relative z-10">
                  <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8 pb-6 border-b border-slate-200">
                    <div>
                      <h2 className="text-3xl font-light text-slate-900 mb-1">Cost Estimate</h2>
                      <p className="text-sm text-slate-500">{floorData.label} • {UNIT_SIZES.find(u => u.value === selectedSize)?.label}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">Effective Rate</p>
                      <p className="text-xl font-mono text-amber-600">
                        {formatINR(floorPrice + (isCorner ? ADDITIONAL_CHARGES.CORNER_PLC_PER_SQFT : 0))} / sq.ft
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4 mb-8">
                    <CostRow label="Basic Sale Price (BSP)" value={bspCost} subtitle={`@ ${formatINR(BASE_PRICE)}/sq.ft`} />
                    <CostRow label="Floor PLC" value={plcCost} subtitle={`@ ${formatINR(floorPrice - BASE_PRICE)}/sq.ft`} />
                    {isCorner && (
                      <CostRow label="Corner PLC" value={cornerCost} subtitle={`@ ${formatINR(ADDITIONAL_CHARGES.CORNER_PLC_PER_SQFT)}/sq.ft`} />
                    )}
                    <CostRow label="EEC & FFC" value={eecFfcCost} subtitle={`@ ${formatINR(ADDITIONAL_CHARGES.EEC_FFC_PER_SQFT)}/sq.ft`} />
                    <CostRow label="IFMS" value={ifmsCost} subtitle={`@ ${formatINR(ADDITIONAL_CHARGES.IFMS_PER_SQFT)}/sq.ft`} />
                    
                    <div className="pt-4 mt-4 border-t border-slate-200 space-y-4">
                      <CostRow label={`Covered Car Parking (${parkingCount})`} value={parkingCost} subtitle={`@ ${formatINR(ADDITIONAL_CHARGES.CAR_PARKING)} each`} />
                      <CostRow label="Club Membership" value={ADDITIONAL_CHARGES.CLUB_MEMBERSHIP} />
                    </div>
                  </div>

                  <div className="pt-6 border-t border-slate-200">
                    <div className="flex items-end justify-between">
                      <div>
                        <p className="text-sm text-slate-500 uppercase tracking-wider mb-1">Total Cost</p>
                        <p className="text-xs text-slate-400">*Excluding GST & Registration</p>
                      </div>
                      <div className="text-right">
                        <motion.span 
                          key={totalCost}
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="text-4xl sm:text-5xl font-light text-slate-900 tracking-tight"
                        >
                          {formatINR(totalCost)}
                        </motion.span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button 
                  onClick={handleDownloadPDF}
                  className="flex items-center justify-center gap-2 py-4 px-6 rounded-xl bg-slate-900 text-white font-medium hover:bg-slate-800 transition-colors active:scale-[0.98] shadow-md"
                >
                  <Download className="w-5 h-5" />
                  Generate PDF
                </button>
                <button 
                  onClick={handleShare}
                  className="flex items-center justify-center gap-2 py-4 px-6 rounded-xl bg-white text-slate-700 font-medium hover:bg-slate-50 transition-colors active:scale-[0.98] border border-slate-200 shadow-sm"
                >
                  <Share2 className="w-5 h-5" />
                  Share Quote
                </button>
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* Hidden PDF Template (Rendered off-screen for perfect A4 capture) */}
      <div className="fixed top-[2000px] left-[2000px] pointer-events-none">
        <div ref={pdfTemplateRef} className="w-[800px] h-[1131px] bg-white p-12 flex flex-col font-sans">
          {/* Header */}
          <div className="flex items-center justify-between border-b-2 border-amber-500 pb-8 mb-8">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-amber-600 rounded-xl flex items-center justify-center shadow-lg">
                <Building2 className="w-10 h-10 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold tracking-tight text-slate-900">KARYAN</h1>
                <p className="text-base font-medium tracking-widest text-amber-600 uppercase mt-1">Trevana Residences</p>
              </div>
            </div>
            <div className="text-right">
              <h2 className="text-3xl font-light text-slate-700">Cost Estimate</h2>
              <p className="text-base text-slate-500 mt-2">{new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
            </div>
          </div>

          {/* Unit Details */}
          <div className="grid grid-cols-2 gap-6 mb-10 bg-slate-50 p-8 rounded-2xl border border-slate-100">
            <div>
              <p className="text-sm text-slate-500 uppercase tracking-wider mb-2">Unit Configuration</p>
              <p className="text-2xl font-medium text-slate-900">{floorData.label} • {selectedSize} sq.ft</p>
              {isCorner && <p className="text-base font-medium text-amber-600 mt-2 flex items-center gap-1"><MapPin className="w-4 h-4" /> Corner Unit</p>}
            </div>
            <div className="text-right">
              <p className="text-sm text-slate-500 uppercase tracking-wider mb-2">Effective Rate</p>
              <p className="text-2xl font-mono text-slate-900">{formatINR(floorPrice + (isCorner ? ADDITIONAL_CHARGES.CORNER_PLC_PER_SQFT : 0))} <span className="text-base text-slate-500 font-sans">/ sq.ft</span></p>
            </div>
          </div>

          {/* Cost Breakdown Table */}
          <div className="flex-grow">
            <h3 className="text-xl font-semibold text-slate-900 mb-6 border-b border-slate-200 pb-3">Detailed Breakdown</h3>
            <div className="space-y-5">
              <PdfCostRow label="Basic Sale Price (BSP)" value={bspCost} subtitle={`@ ${formatINR(BASE_PRICE)}/sq.ft`} />
              <PdfCostRow label="Floor PLC" value={plcCost} subtitle={`@ ${formatINR(floorPrice - BASE_PRICE)}/sq.ft`} />
              {isCorner && (
                <PdfCostRow label="Corner PLC" value={cornerCost} subtitle={`@ ${formatINR(ADDITIONAL_CHARGES.CORNER_PLC_PER_SQFT)}/sq.ft`} />
              )}
              <PdfCostRow label="EEC & FFC" value={eecFfcCost} subtitle={`@ ${formatINR(ADDITIONAL_CHARGES.EEC_FFC_PER_SQFT)}/sq.ft`} />
              <PdfCostRow label="IFMS" value={ifmsCost} subtitle={`@ ${formatINR(ADDITIONAL_CHARGES.IFMS_PER_SQFT)}/sq.ft`} />
              
              <div className="pt-5 mt-5 border-t border-slate-100 space-y-5">
                <PdfCostRow label={`Covered Car Parking (${parkingCount})`} value={parkingCost} subtitle={`@ ${formatINR(ADDITIONAL_CHARGES.CAR_PARKING)} each`} />
                <PdfCostRow label="Club Membership" value={ADDITIONAL_CHARGES.CLUB_MEMBERSHIP} />
              </div>
            </div>
          </div>

          {/* Total */}
          <div className="mt-8 pt-8 border-t-2 border-slate-800 flex items-end justify-between bg-slate-50 p-8 rounded-2xl">
            <div>
              <p className="text-xl text-slate-700 font-medium mb-1">Total Cost</p>
              <p className="text-sm text-slate-500">*Excluding GST & Registration</p>
            </div>
            <p className="text-5xl font-bold text-slate-900 tracking-tight">{formatINR(totalCost)}</p>
          </div>

          {/* Footer */}
          <div className="mt-12 pt-6 border-t border-slate-200 text-center text-sm text-slate-400">
            <p>This is a system generated estimate and does not constitute a legal offer.</p>
            <p className="mt-1">Prices and availability are subject to change without prior notice.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function CostRow({ label, value, subtitle }: { label: string; value: number; subtitle?: string }) {
  return (
    <div className="flex items-center justify-between group">
      <div>
        <p className="text-slate-700 font-medium group-hover:text-slate-900 transition-colors">{label}</p>
        {subtitle && <p className="text-xs text-slate-500 font-mono mt-0.5">{subtitle}</p>}
      </div>
      <div className="text-right">
        <p className="text-slate-900 font-mono">{formatINR(value)}</p>
      </div>
    </div>
  );
}

function PdfCostRow({ label, value, subtitle }: { label: string; value: number; subtitle?: string }) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-slate-800 font-medium text-lg">{label}</p>
        {subtitle && <p className="text-sm text-slate-500 font-mono mt-1">{subtitle}</p>}
      </div>
      <div className="text-right">
        <p className="text-slate-900 font-mono font-medium text-xl">{formatINR(value)}</p>
      </div>
    </div>
  );
}

