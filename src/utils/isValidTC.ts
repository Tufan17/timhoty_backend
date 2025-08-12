export default function validateTCKimlikNo(tcNo: string): boolean {
  // TC Kimlik Numarası 11 haneli olmalı ve '0' ile başlamamalı
  if (tcNo.length !== 11 || tcNo[0] === '0') {
    return false;
  }

  // TC Kimlik Numarasını rakamlara ayıralım
  const digits = tcNo.split('').map(Number);

  // 1, 3, 5, 7, 9. rakamların toplamı
  const oddSum = digits[0] + digits[2] + digits[4] + digits[6] + digits[8];

  // 2, 4, 6, 8. rakamların toplamı
  const evenSum = digits[1] + digits[3] + digits[5] + digits[7];

  // 10. rakamın hesaplanması
  const tenthDigit = (oddSum * 7 - evenSum) % 10;

  // 11. rakamın hesaplanması
  const eleventhDigit = (oddSum * 8) % 10;

  // 10. ve 11. rakamın doğruluğunu kontrol edelim
  if (digits[9] !== tenthDigit || digits[10] !== eleventhDigit) {
    return false;
  }

  return true;
}
