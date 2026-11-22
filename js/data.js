// 감각적인 라이프스타일 셀렉트숍 'ATELIER NOOK (아틀리에 눅)' 상품 데이터베이스
let PRODUCTS = [
  {
    id: 1,
    name: "페탈 세라믹 화병 (Petal Ceramic Vase)",
    category: "ceramics",
    categoryName: "도자기 & 오브제",
    price: 48000,
    originalPrice: 58000,
    tag: "BEST",
    badgeColor: "bg-stone-900 text-white",
    rating: 4.9,
    reviewCount: 38,
    images: [
      "https://images.unsplash.com/photo-1612196808214-b8e1d6145a8c?q=80&w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1578749556568-bc2c40e68b61?q=80&w=800&auto=format&fit=crop"
    ],
    summary: "흙 본연의 질감을 그대로 살린 비정형 실루엣의 핸드크래프트 화병입니다.",
    description: "손으로 빚어낸 곡선의 불완전함이 주는 따뜻한 미학. 단 한 송이의 들꽃이나 가지를 꽂아두어도 공간의 공기를 차분하게 가라앉혀 줍니다. 유광 처리되지 않은 매트한 백토 표면이 주는 내추럴한 감촉을 느껴보세요.",
    options: ["크림 아이보리", "웜 샌드", "테라코타"],
    dimensions: "140 x 195 mm / 약 620g",
    material: "도자기 (백토 소성)",
    isNew: false,
    isPopular: true
  },
  {
    id: 2,
    name: "모놀리스 소이 왁스 필라 캔들",
    category: "scent",
    categoryName: "향 & 캔들",
    price: 32000,
    originalPrice: null,
    tag: "NEW",
    badgeColor: "bg-amber-800 text-white",
    rating: 4.8,
    reviewCount: 19,
    images: [
      "https://images.unsplash.com/photo-1603006905003-be475563bc59?q=80&w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1506806732259-39c2d0268443?q=80&w=800&auto=format&fit=crop"
    ],
    summary: "천연 소이 왁스와 무화과, 삼나무의 우디 노트가 어우러진 조각적 캔들.",
    description: "불을 붙이지 않고 오브제로 올려두는 것만으로도 은은한 숲의 잔향이 퍼져나갑니다. 100% 천연 식물성 소이 왁스로 인공 경화제를 넣지 않아 연소 시 그을음이 거의 없습니다.",
    options: ["피그 & 시더우드", "네롤리 & 세이지", "스모키 베티버"],
    dimensions: "85 x 85 x 110 mm / 연소시간 약 45시간",
    material: "100% 식물성 소이왁스, 면 심지",
    isNew: true,
    isPopular: true
  },
  {
    id: 3,
    name: "솔리드 브라스 인센스 홀더 & 트레이",
    category: "scent",
    categoryName: "향 & 캔들",
    price: 52000,
    originalPrice: 62000,
    tag: "SALE",
    badgeColor: "bg-red-700 text-white",
    rating: 5.0,
    reviewCount: 42,
    images: [
      "https://images.unsplash.com/photo-1602928321679-560bb453f190?q=80&w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1596464716127-f2a829822391?q=80&w=800&auto=format&fit=crop"
    ],
    summary: "시간이 지날수록 멋스러운 에이징을 선사하는 황동 인센스 버너.",
    description: "묵직한 황동 원괴를 정밀 절삭하여 제작한 인센스 홀더입니다. 선향 규격(2~3mm) 모두 안정적으로 거치되며, 넉넉한 트레이가 재를 깔끔하게 받아줍니다. 사용자의 손길에 따라 파티나(세월의 흔적)가 깃듭니다.",
    options: ["빈티지 브라스", "매트 실버"],
    dimensions: "210 x 45 x 15 mm / 280g",
    material: "황동 (Solid Brass)",
    isNew: false,
    isPopular: true
  },
  {
    id: 4,
    name: "알레그로 무선 포터블 무드 램프",
    category: "lighting",
    categoryName: "조명 & 라이팅",
    price: 89000,
    originalPrice: 110000,
    tag: "BEST",
    badgeColor: "bg-stone-900 text-white",
    rating: 4.9,
    reviewCount: 67,
    images: [
      "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?q=80&w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?q=80&w=800&auto=format&fit=crop"
    ],
    summary: "터치 3단계 조광, 침실과 서재를 아늑하게 채우는 충전식 미니멀 램프.",
    description: "버섯 형태의 부드러운 돔 헤드가 눈부심 없이 공간 전체에 따뜻한 2700K 웜톤 빛을 선사합니다. USB-C 완충 시 최대 16시간 동안 자유롭게 무선으로 이동하며 사용할 수 있습니다.",
    options: ["버터 옐로우", "스모키 그레이", "매트 화이트"],
    dimensions: "지름 160 x 높이 240 mm / 540g",
    material: "알루미늄 바디, 폴리카보네이트 디퓨저",
    isNew: false,
    isPopular: true
  },
  {
    id: 5,
    name: "프렌치 워시드 린넨 쿠션 커버 (50x50)",
    category: "fabric",
    categoryName: "패브릭 & 베딩",
    price: 36000,
    originalPrice: null,
    tag: "SUSTAINABLE",
    badgeColor: "bg-emerald-800 text-white",
    rating: 4.7,
    reviewCount: 23,
    images: [
      "https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?q=80&w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?q=80&w=800&auto=format&fit=crop"
    ],
    summary: "프랑스산 천연 플랙스로 직조한 워싱 린넨 특유의 기분 좋은 바스락거림.",
    description: "바이오 워싱 가공을 거쳐 맨살에 닿는 촉감이 더없이 포근합니다. 정형화되지 않은 자연스러운 구김이 거실 소파나 침실에 무심한 듯 감각적인 분위기를 더해줍니다.",
    options: ["오트밀 베이지", "소프트 올리브", "포그 그레이"],
    dimensions: "500 x 500 mm (솜 미포함)",
    material: "프렌치 퓨어 린넨 100%",
    isNew: false,
    isPopular: false
  },
  {
    id: 6,
    name: "오가닉 오크우드 비정형 트레이",
    category: "living",
    categoryName: "리빙 & 키친",
    price: 45000,
    originalPrice: 50000,
    tag: null,
    badgeColor: "",
    rating: 4.8,
    reviewCount: 15,
    images: [
      "https://images.unsplash.com/photo-1590736969955-71cc94801759?q=80&w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1544816155-12df9643f363?q=80&w=800&auto=format&fit=crop"
    ],
    summary: "북미산 화이트 오크 원목의 결을 살려 깎아낸 다목적 우드 플레이트.",
    description: "향수, 주얼리 트레이 혹은 간단한 핑거푸드나 커피 잔을 올려두는 서빙 보드로 활용하기 좋습니다. 천연 호두오일로 마감하여 목재의 숨결과 따뜻한 색감이 오래 유지됩니다.",
    options: ["화이트 오크 (내추럴)", "월넛 (다크브라운)"],
    dimensions: "280 x 180 x 20 mm / 약 310g",
    material: "FSC 인증 북미산 참나무(White Oak)",
    isNew: false,
    isPopular: false
  },
  {
    id: 7,
    name: "현무암 아로마 스톤 디퓨저 세트",
    category: "scent",
    categoryName: "향 & 캔들",
    price: 39000,
    originalPrice: null,
    tag: "GIFT SET",
    badgeColor: "bg-stone-700 text-white",
    rating: 4.9,
    reviewCount: 31,
    images: [
      "https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?q=80&w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1616401784845-180882ba9ba8?q=80&w=800&auto=format&fit=crop"
    ],
    summary: "자연 그대로의 현무암에 순수 에센셜 오일을 떨어뜨려 발향하는 스톤 디퓨저.",
    description: "불이나 전기를 사용하지 않는 가장 안전하고 자연 친화적인 발향 방식입니다. 책상 위, 침대 머리맡에 두고 오일 3~4방울을 떨어뜨리면 하루의 피로를 풀어주는 싱그러운 향기가 피어납니다. (오일 10ml 포함)",
    options: ["비 온 뒤 편백숲", "새벽 들꽃 언덕", "시트러스 가든"],
    dimensions: "스톤 보울 지름 100mm, 천연 화산석 약 200g",
    material: "자연 화산석, 도자기 트레이",
    isNew: true,
    isPopular: true
  },
  {
    id: 8,
    name: "헤리티지 와플 키친 클로스 세트 (2pcs)",
    category: "fabric",
    categoryName: "패브릭 & 베딩",
    price: 24000,
    originalPrice: 28000,
    tag: "SET",
    badgeColor: "bg-stone-800 text-white",
    rating: 4.9,
    reviewCount: 54,
    images: [
      "https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?q=80&w=800&auto=format&fit=crop",
      "https://images.unsplash.com/photo-1616046229478-9901c5536a45?q=80&w=800&auto=format&fit=crop"
    ],
    summary: "우수한 흡수성과 빠른 건조력을 자랑하는 오가닉 코튼 와플 패브릭.",
    description: "주방의 감도를 한 단계 올려주는 입체적인 와플 조직의 다용도 패브릭입니다. 식기 건조 매트나 핸드 타올, 냄비 받침 등 어디서나 감각적으로 어우러집니다.",
    options: ["버터밀크 + 세이지", "초콜릿 + 샌드베이지"],
    dimensions: "350 x 500 mm (2장 세트)",
    material: "100% 오가닉 코튼",
    isNew: false,
    isPopular: false
  }
];

// 카테고리 정의
const CATEGORIES = [
  { id: "all", name: "전체보기 (All)" },
  { id: "ceramics", name: "도자기 & 오브제" },
  { id: "scent", name: "향 & 캔들" },
  { id: "lighting", name: "조명 & 라이팅" },
  { id: "fabric", name: "패브릭 & 베딩" },
  { id: "living", name: "리빙 & 키친" }
];
