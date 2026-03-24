/**
 * Scarica o apre un file (PDF) - compatibile con browser e app Capacitor/Android.
 * Su Android: salva in cache e apre direttamente con FileViewer (visualizzatore PDF di sistema).
 */
import { Capacitor } from "@capacitor/core";
import { Filesystem, Directory } from "@capacitor/filesystem";
import { FileViewer } from "@capacitor/file-viewer";
import { Share } from "@capacitor/share";

async function blobToBase64(blob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result.split(",")[1]);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function uriToPath(uri) {
  if (!uri) return uri;
  if (uri.startsWith("file://")) {
    return uri.replace(/^file:\/\//, "");
  }
  return uri;
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
      const filePath = uriToPath(uri);
      try {
        await FileViewer.openDocumentFromLocalPath({ path: filePath });
        return { localPath: filePath, url: uri };
      } catch (viewerErr) {
        await Share.share({
          title: fileName,
          text: "Documento generato dall'app Busta Badante",
          files: [uri],
          dialogTitle: "Apri PDF",
        });
        return { localPath: filePath, url: uri };
      }
    } catch (err) {
      console.error("Errore apertura PDF:", err);
      throw err;
    }
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 100);
  return { url };
}

/**
 * Apre un PDF già salvato in cache (solo su app nativa).
 * Usare quando l'utente clicca "Apri PDF" sull'elenco documenti.
 */
export async function openPdfByPath(localPath) {
  if (!Capacitor.isNativePlatform() || !localPath) return;
  await FileViewer.openDocumentFromLocalPath({ path: localPath });
}
