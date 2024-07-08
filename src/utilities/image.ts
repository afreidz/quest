export function fileToDataUri(fileList: FileList | null): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!fileList || !fileList?.[0]) {
      reject(new Error("No files in the FileList."));
      return;
    }

    const file = fileList[0];
    const reader = new FileReader();

    reader.onload = () => {
      if (reader.result) {
        resolve(reader.result as string);
      } else {
        reject(new Error("File reading failed."));
      }
    };

    reader.onerror = () => {
      reject(new Error("File reading failed."));
    };

    reader.readAsDataURL(file);
  });
}

export function dataUriToFile(dataUri: string, fileName: string): File {
  const byteString = atob(dataUri.split(",")[1]);
  const mimeString = dataUri.split(",")[0].split(":")[1].split(";")[0];

  const arrayBuffer = new ArrayBuffer(byteString.length);
  const uintArray = new Uint8Array(arrayBuffer);

  for (let i = 0; i < byteString.length; i++) {
    uintArray[i] = byteString.charCodeAt(i);
  }

  const blob = new Blob([uintArray], { type: mimeString });
  return new File([blob], fileName, { type: mimeString });
}
