/**
 * Scarica o apre un file (PDF) - compatibile con browser e app Capacitor/Android.
 * Su Android il download via blob non funziona; usiamo Filesystem + Share.
 */
import { Capacitor } from "@capacitor/core";
import { Filesystem, Directory } from "@capacitor/filesystem";
import { Share } from "@capacitor/share";

async function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result.split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export async function downloadOrOpenPdf(blob, fileName) {
  if (Capacitor.isNativePlatform()) {
    try {
      const base64 = await blobToBase64(blob);
      const path = fileName;
      await Filesystem.writeFile({
        path,
        data: base64,
        directory: Directory.Cache,
      });
      const { uri } = await Filesystem.getUri({
        directory: Directory.Cache,
        path,
      });
      await Share.share({
        title: fileName,
        text: "Documento generato dall'app Busta Badante",
        files: [uri],
        dialogTitle: "Apri o salva PDF",
      });
      return true;
    } catch (err) {
      console.error("Errore apertura PDF:", err);
      throw err;
    }
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.click();
  URL.revokeObjectURL(url);
  return true;
}
