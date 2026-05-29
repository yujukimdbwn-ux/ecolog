export function fileToBase64(file: File): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const r = reader.result as string;
      const parts = r.split(',');
      const base64 = parts.length > 1 ? parts[1]! : r;
      const mimeType = file.type || 'image/jpeg';
      resolve({ base64, mimeType });
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
