/**
 * ĂN GÌ MOM — Batch 0 Fixtures (Demo Data)
 * Gắn cờ: [DEMO_FIXTURE]
 * Dữ liệu phục vụ kiểm thử Prototype P1 (Discovery, Recipe, Meal & Shopping)
 */

export const BATCH_0_FIXTURES = [
  {
    id: "thit-ba-chi-kho-tieu",
    slug: "thit-ba-chi-kho-tieu",
    name: "Thịt ba chỉ kho tiêu",
    aliases: ["Thịt kho tiêu", "Thịt lợn kho tiêu"],
    role: "MAIN", // Món mặn
    roleLabel: "Món mặn",
    baseServings: 4,
    prepTime: 15,
    cookTime: 25,
    difficulty: "Dễ",
    author: "Bếp Mẹ Nấu",
    source: "Công thức gia đình truyền thống",
    tag: "[DEMO_FIXTURE]",
    isTested: true,
    image: "https://images.unsplash.com/photo-1544025162-d76694265947?auto=format&fit=crop&w=800&q=80",
    description: "Thịt ba chỉ thái miếng vừa ăn, thắng nước màu cánh gián, kho liu riu đậm đà thơm cay nồng vị hạt tiêu xay.",
    ingredients: [
      { name: "Thịt ba chỉ heo", amount: 400, unit: "g", preparation: "thái con chì dày 1cm", scalePolicy: "LINEAR" },
      { name: "Hành tím", amount: 3, unit: "củ", preparation: "băm nhỏ", scalePolicy: "LINEAR" },
      { name: "Tiêu đen xay", amount: 1, unit: "thìa cà phê", preparation: "xay vỡ hạt", scalePolicy: "MANUAL_ADJUST" },
      { name: "Nước mắm truyền thống", amount: 2, unit: "thìa canh", preparation: "40 độ đạm", scalePolicy: "LINEAR" },
      { name: "Đường hoa mai", amount: 1, unit: "thìa canh", preparation: "để thắng màu", scalePolicy: "LINEAR" }
    ],
    steps: [
      { order: 1, phase: "Sơ chế & Ướp", content: "Thịt chần nước sôi 1 phút rồi rửa sạch. Ướp với 1 thìa canh nước mắm, hành tím băm và 1/2 thìa tiêu trong 15 phút." },
      { order: 2, phase: "Thắng nước màu", content: "Đun 1 thìa đường với chút dầu ăn đến màu cánh gián đậm thì cho thịt vào đảo săn." },
      { order: 3, phase: "Kho thịt", content: "Thêm nước mắm và 50ml nước sôi xâm xấp mặt thịt, đậy vung đun nhỏ lửa 20 phút đến khi nước sốt sệt lại." },
      { order: 4, phase: "Hoàn thiện", content: "Rắc tiêu đen xay và hành hoa lên trên, tắt bếp và dùng nóng với cơm trắng." }
    ]
  },
  {
    id: "ga-rang-gung-la-chanh",
    slug: "ga-rang-gung-la-chanh",
    name: "Gà rang gừng lá chanh",
    aliases: ["Gà kho gừng", "Thịt gà rang gừng"],
    role: "MAIN",
    roleLabel: "Món mặn",
    baseServings: 4,
    prepTime: 15,
    cookTime: 20,
    difficulty: "Dễ",
    author: "Bếp Bà Ngoại",
    source: "Ẩm thực truyền thống Bắc Bộ",
    tag: "[DEMO_FIXTURE]",
    isTested: true,
    image: "https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?auto=format&fit=crop&w=800&q=80",
    description: "Thịt gà ta chắc thịt rang xém cạnh, thơm nức mùi gừng tươi và lá chanh thái chỉ, vị đậm đà ấm bụng.",
    ingredients: [
      { name: "Thịt gà ta", amount: 600, unit: "g", preparation: "chặt miếng vừa ăn", scalePolicy: "LINEAR" },
      { name: "Gừng tươi", amount: 1, unit: "nhánh lớn", preparation: "thái sợi chỉ", scalePolicy: "FIXED" },
      { name: "Lá chanh", amount: 5, unit: "lá", preparation: "rửa sạch, thái chỉ mỏng", scalePolicy: "FIXED" },
      { name: "Nước mắm", amount: 2, unit: "thìa canh", preparation: "loại ngon", scalePolicy: "LINEAR" },
      { name: "Hành khô", amount: 2, unit: "củ", preparation: "băm nhỏ", scalePolicy: "LINEAR" }
    ],
    steps: [
      { order: 1, phase: "Sơ chế", content: "Thịt gà xát muối, rửa sạch để ráo, chặt miếng bao diêm. Ướp với 1 thìa nước mắm và hành băm." },
      { order: 2, phase: "Rang xém cạnh", content: "Phi thơm 1/2 gừng rồi cho gà vào đảo lửa lớn đến khi da gà săn xém cạnh và tiết mỡ." },
      { order: 3, phase: "Đảo ngấm gia vị", content: "Hạ lửa vừa, cho nốt gừng thái chỉ và 1 thìa nước mắm vào đảo đều trong 10 phút." },
      { order: 4, phase: "Rắc lá chanh", content: "Tắt bếp rồi rắc lá chanh thái chỉ lên trên đảo đều cho thơm nức." }
    ]
  },
  {
    id: "ca-basa-kho-to",
    slug: "ca-basa-kho-to",
    name: "Cá basa kho tộ",
    aliases: ["Cá kho tộ", "Cá hú kho tộ"],
    role: "MAIN",
    roleLabel: "Món mặn",
    baseServings: 4,
    prepTime: 20,
    cookTime: 30,
    difficulty: "Trung bình",
    author: "Bếp Miền Nam",
    source: "Ẩm thực miền Tây Nam Bộ",
    tag: "[DEMO_FIXTURE]",
    isTested: true,
    image: "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?auto=format&fit=crop&w=800&q=80",
    description: "Khúc cá basa béo ngậy được kho trong nồi đất với nước màu dừa, ớt hiểm và đầu hành lá, nước kho sánh quyện.",
    ingredients: [
      { name: "Cá basa cắt khúc", amount: 500, unit: "g", preparation: "rửa sạch với muối và giấm", scalePolicy: "LINEAR" },
      { name: "Thịt ba chỉ", amount: 100, unit: "g", preparation: "thái mỏng tạo mỡ béo", scalePolicy: "LINEAR" },
      { name: "Hành tím & tỏi", amount: 3, unit: "củ", preparation: "băm nhuyễn", scalePolicy: "LINEAR" },
      { name: "Nước màu dừa", amount: 1, unit: "thìa canh", preparation: "nguyên chất", scalePolicy: "LINEAR" },
      { name: "Ớt hiểm", amount: 2, unit: "trái", preparation: "để nguyên hoặc đập dập", scalePolicy: "MANUAL_ADJUST" }
    ],
    steps: [
      { order: 1, phase: "Ướp cá", content: "Ướp cá với nước mắm, đường, nước màu dừa, hành tỏi băm trong 20 phút cho thấm sâu." },
      { order: 2, phase: "Xào thịt mỡ", content: "Rán xém cạnh thịt ba chỉ trong nồi đất để tiết mỡ béo thơm." },
      { order: 3, phase: "Kho liu riu", content: "Xếp cá vào nồi đất, đun sôi bùng 2 phút rồi hạ lửa liu riu trong 25 phút cho nước kho keo lại." },
      { order: 4, phase: "Hoàn tất", content: "Rắc tiêu đen và đầu hành lá tước sợi, dùng nóng với cơm cháy hoặc cơm trắng." }
    ]
  },
  {
    id: "canh-rau-ngot-thit-bam",
    slug: "canh-rau-ngot-thit-bam",
    name: "Canh rau ngót nấu thịt băm",
    aliases: ["Canh bồ ngót", "Canh ngót thịt"],
    role: "SOUP", // Món canh
    roleLabel: "Món canh",
    baseServings: 4,
    prepTime: 10,
    cookTime: 10,
    difficulty: "Dễ",
    author: "Bếp Mẹ Nấu",
    source: "Bữa cơm nhà thanh mát",
    tag: "[DEMO_FIXTURE]",
    isTested: true,
    image: "https://images.unsplash.com/photo-1547592180-85f173990554?auto=format&fit=crop&w=800&q=80",
    description: "Bát canh rau ngót xanh mướt, nước canh ngọt lịm tự nhiên từ thịt nạc thăn băm nhỏ, thanh nhiệt tuyệt vời.",
    ingredients: [
      { name: "Rau ngót", amount: 2, unit: "bó", preparation: "tuốt lá, rửa sạch và vò nhẹ", scalePolicy: "LINEAR" },
      { name: "Thịt nạc vai băm", amount: 150, unit: "g", preparation: "băm nhỏ hoặc xay", scalePolicy: "LINEAR" },
      { name: "Hành khô", amount: 1, unit: "củ", preparation: "thái mỏng", scalePolicy: "LINEAR" },
      { name: "Gia vị (muối, hạt nêm)", amount: 1.5, unit: "thìa cà phê", preparation: "nêm vừa ăn", scalePolicy: "MANUAL_ADJUST" }
    ],
    steps: [
      { order: 1, phase: "Xào thịt", content: "Phi thơm hành tím, cho thịt băm vào xào săn với chút gia vị." },
      { order: 2, phase: "Nấu nước canh", content: "Đổ 800ml nước vào nồi đun sôi bùng, vớt bọt nếu có." },
      { order: 3, phase: "Nấu rau ngót", content: "Cho rau ngót đã vò nhẹ vào nồi, đun sôi lại trong 2-3 phút cho rau vừa chín tới thì tắt bếp." }
    ]
  },
  {
    id: "canh-chua-ca-loc",
    slug: "canh-chua-ca-loc",
    name: "Canh chua cá lóc miền Tây",
    aliases: ["Canh chua cá quả", "Canh chua Nam Bộ"],
    role: "SOUP",
    roleLabel: "Món canh",
    baseServings: 4,
    prepTime: 20,
    cookTime: 15,
    difficulty: "Trung bình",
    author: "Bếp Miền Tây",
    source: "Đặc sản mâm cơm Nam Bộ",
    tag: "[DEMO_FIXTURE]",
    isTested: true,
    image: "https://images.unsplash.com/photo-1512058564366-18510be2db19?auto=format&fit=crop&w=800&q=80",
    description: "Vị chua thanh mát từ me dốt, thơm ngậy của cá lóc đồng, giòn ngọt từ dọc mùng, giá đỗ, cà chua và rau ngò om.",
    ingredients: [
      { name: "Cá lóc đồng", amount: 400, unit: "g", preparation: "làm sạch, cắt khúc", scalePolicy: "LINEAR" },
      { name: "Me vắt chín", amount: 50, unit: "g", preparation: "dầm lấy nước cốt", scalePolicy: "FIXED" },
      { name: "Cà chua", amount: 2, unit: "quả", preparation: "bổ múi cau", scalePolicy: "LINEAR" },
      { name: "Dứa (thơm)", amount: 100, unit: "g", preparation: "thái lát tam giác", scalePolicy: "LINEAR" },
      { name: "Bạc hà (dọc mùng)", amount: 1, unit: "cây", preparation: "tước vỏ, thái vát chéo", scalePolicy: "LINEAR" },
      { name: "Rau ngò gai & ngò om", amount: 1, unit: "mớ nhỏ", preparation: "thái nhỏ", scalePolicy: "FIXED" }
    ],
    steps: [
      { order: 1, phase: "Nấu nước dùng", content: "Đun sôi 1 lít nước, cho nước cốt me và dứa, cà chua vào đun sôi." },
      { order: 2, phase: "Nấu cá", content: "Thả khúc cá lóc vào đun sôi 7 phút đến khi cá chín ngọt nước." },
      { order: 3, phase: "Thêm rau & hoàn tất", content: "Cho bạc hà, giá đỗ vào đun sôi bùng rồi tắt bếp ngay. Nêm nước mắm và rắc rau ngò om lên trên." }
    ]
  },
  {
    id: "rau-muong-xao-toi",
    slug: "rau-muong-xao-toi",
    name: "Rau muống xào tỏi",
    aliases: ["Rau muống xào", "Rau xào tỏi"],
    role: "SIDE", // Món rau / phụ
    roleLabel: "Rau / Món phụ",
    baseServings: 4,
    prepTime: 10,
    cookTime: 5,
    difficulty: "Dễ",
    author: "Bếp Mẹ Nấu",
    source: "Món rau quốc dân mâm cơm Việt",
    tag: "[DEMO_FIXTURE]",
    isTested: true,
    image: "https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80",
    description: "Ngọn rau muống xanh mướt giòn sần sật, dậy mùi thơm lừng của tỏi ta phi vàng giòn rụm trên chảo lửa lớn.",
    ingredients: [
      { name: "Rau muống non", amount: 1, unit: "bó (400g)", preparation: "nhặt bớt lá già, rửa sạch", scalePolicy: "LINEAR" },
      { name: "Tỏi ta", amount: 2, unit: "củ", preparation: "đập dập, chia 2 phần", scalePolicy: "LINEAR" },
      { name: "Dầu ăn", amount: 2, unit: "thìa canh", preparation: "dùng xào lửa lớn", scalePolicy: "LINEAR" },
      { name: "Nước mắm / dầu hào", amount: 1, unit: "thìa canh", preparation: "nêm vừa miệng", scalePolicy: "MANUAL_ADJUST" }
    ],
    steps: [
      { order: 1, phase: "Chần sơ (tùy chọn)", content: "Chần rau qua nước sôi có chút muối trong 30 giây rồi vớt ngay ra âu nước đá để rau giòn xanh." },
      { order: 2, phase: "Phi thơm tỏi", content: "Làm nóng chảo với dầu ăn, phi vàng thơm 1/2 lượng tỏi đập dập." },
      { order: 3, phase: "Xào lửa lớn", content: "Bật lửa thật lớn, trút rau muống vào đảo nhanh tay trong 2 phút, nêm gia vị vừa ăn rồi cho nốt phần tỏi còn lại vào đảo đều và tắt bếp." }
    ]
  },
  {
    id: "dau-hu-sot-ca-chua",
    slug: "dau-hu-sot-ca-chua",
    name: "Đậu hũ sốt cà chua",
    aliases: ["Đậu phụ sốt cà", "Đậu sốt cà chua"],
    role: "SIDE",
    roleLabel: "Rau / Món phụ",
    baseServings: 4,
    prepTime: 10,
    cookTime: 15,
    difficulty: "Dễ",
    author: "Bếp Gia Đình",
    source: "Bữa cơm đạm bạc quen thuộc",
    tag: "[DEMO_FIXTURE]",
    isTested: true,
    image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80",
    description: "Miếng đậu hũ chiên vàng ươm, mềm mọng ngập trong nước sốt cà chua sánh mịn, phủ đầy hành hoa thái nhỏ.",
    ingredients: [
      { name: "Đậu hũ trắng", amount: 4, unit: "miếng", preparation: "cắt vuông quân cờ", scalePolicy: "LINEAR" },
      { name: "Cà chua chín mọng", amount: 3, unit: "quả", preparation: "băm nhỏ hoặc thái hạt lựu", scalePolicy: "LINEAR" },
      { name: "Hành tím", amount: 1, unit: "củ", preparation: "thái mỏng", scalePolicy: "LINEAR" },
      { name: "Hành lá & mùi tàu", amount: 2, unit: "nhánh", preparation: "thái nhỏ", scalePolicy: "FIXED" },
      { name: "Nước mắm", amount: 1.5, unit: "thìa canh", preparation: "nêm nước sốt", scalePolicy: "LINEAR" }
    ],
    steps: [
      { order: 1, phase: "Rán đậu", content: "Rán đậu hũ vàng giòn các mặt trên chảo dầu nóng, vớt ra đĩa để ráo dầu." },
      { order: 2, phase: "Nấu sốt cà", content: "Phi thơm hành tím, trút cà chua băm vào xào nhuyễn cùng chút gia vị đến khi tạo thành sốt sánh mịn." },
      { order: 3, phase: "Om đậu ngấm vị", content: "Thả đậu rán vào chảo sốt cà chua, đun nhỏ lửa 5 phút cho đậu ngấm đều sốt." },
      { order: 4, phase: "Hoàn thiện", content: "Rắc hành lá thái nhỏ lên trên, múc ra đĩa sâu lòng và ăn cùng cơm nóng." }
    ]
  }
];
