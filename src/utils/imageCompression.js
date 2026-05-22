// 图片压缩工具
// 支持 JPG、PNG、WebP 格式，自动压缩至合理大小且保持质量

export async function compressImage(file) {
  return new Promise((resolve, reject) => {
    // 验证文件类型
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      reject(new Error('仅支持 JPG、PNG、WebP 格式'));
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        // 设置压缩目标尺寸（保持宽高比）
        const maxWidth = 1200;
        const maxHeight = 1200;
        let { width, height } = img;

        if (width > height) {
          if (width > maxWidth) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        // 转换为 WebP 格式（更小）或保持原格式，质量设置为 0.8
        const outputFormat = 'image/webp';
        const quality = 0.8;

        canvas.toBlob(
          (blob) => {
            const reader = new FileReader();
            reader.onload = () => {
              resolve({
                data: reader.result, // Base64 字符串
                name: file.name,
                size: blob.size,
                originalSize: file.size,
              });
            };
            reader.readAsDataURL(blob);
          },
          outputFormat,
          quality
        );
      };
      img.onerror = () => reject(new Error('图片加载失败'));
      img.src = e.target.result;
    };
    reader.onerror = () => reject(new Error('文件读取失败'));
    reader.readAsDataURL(file);
  });
}

// 格式化文件大小
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}
