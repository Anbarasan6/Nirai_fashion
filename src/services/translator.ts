// Smart Tamil Translation & Terminology Generator for Ethnic Wear
export function generateTamilProductDetails(nameEn: string, descEn: string, fabric: string, style: string) {
  const dictionary: Record<string, string> = {
    saree: 'புடவை',
    sari: 'புடவை',
    silk: 'பட்டு',
    cotton: 'பருத்தி',
    'pure silk': 'தூய பட்டு',
    kanchipuram: 'காஞ்சிபுரம்',
    kanchi: 'காஞ்சிபுரம்',
    chettinad: 'செட்டிநாடு',
    salem: 'சேலம்',
    vesti: 'வேஷ்டி',
    dhoti: 'வேட்டி',
    angavastram: 'அங்கவஸ்திரம்',
    towel: 'துண்டு',
    shirt: 'சட்டை',
    kurta: 'குர்தா',
    linen: 'லினன்',
    zari: 'ஜரிகை',
    gold: 'தங்கம்',
    'temple gold': 'கோவில் தங்க ஜரிகை',
    border: 'கரை',
    peacock: 'மயில்',
    maroon: 'மெரூன்',
    crimson: 'குங்கும சிவப்பு',
    emerald: 'மரகத பச்சை',
    green: 'பச்சை',
    blue: 'நீலம்',
    'peacock blue': 'மயில் கழுத்து நீலம்',
    ivory: 'சந்தன நிறம் / சந்தன வெள்ளை',
    white: 'வெள்ளை',
    kids: 'சிறுவர்',
    girl: 'சிறுமி',
    boy: 'சிறுவன்',
    'pattu pavadai': 'பட்டுப் பாவாடை',
    lehenga: 'பாவாடை சட்டை',
    traditional: 'பாரம்பரிய',
    festive: 'பண்டிகை',
    ceremonial: 'மங்கல நிகழ்வு',
    wedding: 'திருமண',
    muhurtham: 'முகூர்த்தம்',
    handloom: 'கைத்தறி',
    woven: 'நெய்யப்பட்ட',
    comfortable: 'இதமான',
    breathable: 'மென்மையான காற்றோட்டமான',
  };

  let nameTa = nameEn;
  // Apply terminology transformations
  if (nameEn.toLowerCase().includes('kanchipuram') && nameEn.toLowerCase().includes('silk')) {
    nameTa = 'காஞ்சிபுரம் தூய பட்டுப் புடவை';
  } else if (nameEn.toLowerCase().includes('chettinad') && nameEn.toLowerCase().includes('cotton')) {
    nameTa = 'செட்டிநாடு பாரம்பரிய கைத்தறி பருத்தி புடவை';
  } else if (nameEn.toLowerCase().includes('vesti') || nameEn.toLowerCase().includes('dhoti')) {
    nameTa = 'சேலம் ராயல் தூய பருத்தி இரட்டை வேஷ்டி & அங்கவஸ்திரம்';
  } else if (nameEn.toLowerCase().includes('linen') || nameEn.toLowerCase().includes('shirt')) {
    nameTa = 'தூய லினன் பாரம்பரிய விசேஷ சட்டை';
  } else if (nameEn.toLowerCase().includes('pattu pavadai')) {
    nameTa = 'சிறுமி பாரம்பரிய கைத்தறி பட்டுப் பாவாடை சட்டை தொகுப்பு';
  } else if (nameEn.toLowerCase().includes('kids') || nameEn.toLowerCase().includes('junior')) {
    nameTa = 'சிறுவர் விசேஷ வெல்க்ரோ வேஷ்டி & குர்தா சட்டை செட்';
  } else {
    nameTa = `${nameEn} - பாரம்பரிய கைத்தறி ஆடை`;
  }

  const descTa = `பாரம்பரிய கைத்தறி நேர்த்தியுடன் கூடிய ${fabric || 'உயர்தர தூய நெசவு'} கொண்டு நெய்யப்பட்ட சிறப்பான ${style || 'திருவிழா மற்றும் மங்கல'} ஆடை. வசதியான பயன்பாடு மற்றும் கம்பீரமான தோற்றத்தை அளிக்கும்.`;
  const shortDescTa = `${fabric || 'பாரம்பரிய நெசவு'} - விழாக்கால நேர்த்தியான பாரம்பரிய ஆடை.`;
  const careTa = 'மென்மையாக பராமரிக்கவும். நிழலில் உலர்த்தவும். தேவைப்பட்டால் டிரை கிளீன் செய்யவும்.';

  return {
    nameTa,
    descriptionTa: descTa,
    shortDescTa,
    careInstructionsTa: careTa,
  };
}
