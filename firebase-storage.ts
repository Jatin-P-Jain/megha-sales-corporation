import admin from "firebase-admin";
const sourceApp = admin.initializeApp(
  {
    credential: admin.credential.cert(require("./serviceAccount.prod.json")),
  },
  "prodApp",
);
const bucket = sourceApp
  .storage()
  .bucket("megha-sales-corporation.firebasestorage.app"); // no "gs://" prefix [web:24]

console.log("✅ Source Firebase Storage initialized.");

export function slugifyPartNumber(partNumber: string) {
  return partNumber
    .trim()
    .toUpperCase()
    .replace(/[^\w\s-]/g, "") // remove punctuation
    .replace(/\s+/g, "-"); // spaces → hyphens
}
const askProducts = [
  {
    partNumber: "AFF BS6 (8 HOLE LINER)",
    imagePath:
      "products/ask/AFF BS6 (8 HOLE LINER)/1757574885582-u-cropped_1757574882348.jpg",
  },
  {
    partNumber: "AFF/XL/AL/SM/BS6/HLP-8(OS-1)",
    imagePath:
      "products/AFFXLALSMBS6HLP-8OS-1/1757586713575-cropped_1757586704420.jpg",
  },
  {
    partNumber: "AFF/XL/AL/SM/BS6/HLP-8(STD)",
    imagePath:
      "products/AFFXLALSMBS6HLP-8STD/1757585124693-cropped_1757585116182.jpg",
  },
  {
    partNumber: "AFF/XL/AL/STAG/2(OS-1)",
    imagePath:
      "products/AFFXLALSTAG2OS-1/1757584630840-cropped_1757584619975.jpg",
  },
  {
    partNumber: "AFF/XL/AL/STAG/2(STD)",
    imagePath:
      "products/AFFXLALSTAG2STD/1757584416227-cropped_1757584409399.jpg",
  },
  { partNumber: "AFF/XL/AL/TP/ALS 3&4(OS-1)", imagePath: "" },
  {
    partNumber: "AFF/XL/AL/TP/ALS 3&4(STD)",
    imagePath:
      "products/AFFXLALTPALS-34STD/1757594435077-cropped_1757594427358.jpg",
  },
  {
    partNumber: "AFF/XL/AL/TP/ALS/3&4 (OS-1)",
    imagePath:
      "products/ask/AFF/XL/AL/TP/ALS/3&4 (OS-1)/1757658697887-u-cropped_1757658693813.jpg",
  },
  {
    partNumber: "AFF/XL/AL/TP/SM/1&2(STD)",
    imagePath:
      "products/ask/AFF/XL/AL/TP/SM/1&2(STD)/1757574744087-u-cropped_1757574739921.jpg",
  },
  {
    partNumber: "AFF/XL/AL/TP/SM/3 & 4 (STD)",
    imagePath:
      "products/ask/AFF/XL/AL/TP/SM/3 & 4 (STD)/1757574691482-u-cropped_1757574687148.jpg",
  },
  {
    partNumber: "AFF/XL/AL/TP/SM/3&4(OS-1)",
    imagePath:
      "products/ask/AFF/XL/AL/TP/SM/3&4(OS-1)/1757574645156-u-cropped_1757574641602.jpg",
  },
  {
    partNumber: "AFF/XL/AL/TP/SM/3&4(OS-2)",
    imagePath:
      "products/ask/AFF/XL/AL/TP/SM/3&4(OS-2)/1757574612172-u-cropped_1757574608627.jpg",
  },
  {
    partNumber: "AFF/XL/AL/TP/SM/3&4(OS-3)",
    imagePath:
      "products/ask/AFF/XL/AL/TP/SM/3&4(OS-3)/1757574580488-u-cropped_1757574577010.jpg",
  },
  {
    partNumber: "AFF/XL/AL/TP/SM/7&8 (OS-2)",
    imagePath:
      "products/ask/AFF/XL/AL/TP/SM/7&8 (OS-2)/1757574428539-u-cropped_1757574424171.jpg",
  },
  {
    partNumber: "AFF/XL/AL/TP/SM/7&8 (STD)",
    imagePath:
      "products/ask/AFF/XL/AL/TP/SM/7&8 (STD)/1757574544869-u-cropped_1757574541514.jpg",
  },
  {
    partNumber: "AFF/XL/AL/TP/SM/7&8(OS-1)",
    imagePath:
      "products/ask/AFF/XL/AL/TP/SM/7&8(OS-1)/1757574464982-u-cropped_1757574460314.jpg",
  },
  {
    partNumber: "AFF/XL/AL/TP/SM/7&8(STD)",
    imagePath:
      "products/ask/AFF/XL/AL/TP/SM/7&8(STD)/1757574501876-u-cropped_1757574498237.jpg",
  },
  {
    partNumber: "AFF/XL/AL/TP/SM/HLP-6(OS-1)",
    imagePath:
      "products/AFFXLALTPSMHLP-6OS-1/1757582352778-cropped_1757582346645.jpg",
  },
  {
    partNumber: "AFF/XL/AL/TP/SM/HLP-6(STD)",
    imagePath:
      "products/AFFXLALTPSMHLP-6STD/1757581947694-cropped_1757581939303.jpg",
  },
  {
    partNumber: "AFF/XL/AL/TP/SM/HLP-7(OS-1)",
    imagePath:
      "products/AFFXLALTPSMHLP-7OS-1/1757582906031-cropped_1757582898459.jpg",
  },
  {
    partNumber: "AFF/XL/AL/TP/SM/HLP-7(OS-2)",
    imagePath:
      "products/AFFXLALTPSMHLP-7OS-2/1757583174871-cropped_1757583168703.jpg",
  },
  {
    partNumber: "AFF/XL/AL/TP/SM/HLP-7(STD)",
    imagePath:
      "products/AFFXLALTPSMHLP-7STD/1757582658219-cropped_1757582650302.jpg",
  },
  {
    partNumber: "AFF/XL/AL/TP/SM/HLP-8(OS-1)",
    imagePath:
      "products/AFFXLALTPSMHLP-8OS-1/1757583685459-cropped_1757583678774.jpg",
  },
  {
    partNumber: "AFF/XL/AL/TP/SM/HLP-8(STD)",
    imagePath:
      "products/AFFXLALTPSMHLP-8STD/1757583468317-cropped_1757583457712.jpg",
  },
  {
    partNumber: "AFF/XL/AMW/1(OS-1)",
    imagePath: "products/AFFXLAMW1OS-1/1757588244025-cropped_1757588237902.jpg",
  },
  {
    partNumber: "AFF/XL/AMW/1(STD)",
    imagePath: "products/AFFXLAMW1STD/1757588412139-cropped_1757588406432.jpg",
  },
  {
    partNumber: "AFF/XL/BB/ECH/MM-25T(OS-1)",
    imagePath:
      "products/AFFXLBBECHMM-25TOS-1/1757587229414-cropped_1757587222826.jpg",
  },
  {
    partNumber: "AFF/XL/BB/ECH/MM-25T(STD)",
    imagePath:
      "products/AFFXLBBECHMM-25TSTD/1757586943750-cropped_1757586928034.jpg",
  },
  {
    partNumber: "AFF/XL/EM/1(OS-1)",
    imagePath: "products/AFFXLEM1OS-1/1757587985270-cropped_1757587969410.jpg",
  },
  {
    partNumber: "AFF/XL/EM/1(STD)",
    imagePath: "products/AFFXLEM1STD/1757587797889-cropped_1757587783099.jpg",
  },
  {
    partNumber: "AFF/XL/FUWA/16(OS-1)",
    imagePath:
      "products/AFFXLFUWA16OS-1/1757593442214-cropped_1757593437246.jpg",
  },
  {
    partNumber: "AFF/XL/FUWA/16(STD)",
    imagePath:
      "products/AFFXLFUWA16STD/1757593145565-cropped_1757593030680.jpg",
  },
  {
    partNumber: "AFF/XL/JOST(OS-1)",
    imagePath: "products/AFFXLJOSTOS-1/1757593874030-cropped_1757593867327.jpg",
  },
  {
    partNumber: "AFF/XL/JOST(STD)",
    imagePath: "products/AFFXLJOSTSTD/1757593715277-cropped_1757593708519.jpg",
  },
  {
    partNumber: "AFF/XL/MAN/RR/10(STD)",
    imagePath:
      "products/AFFXLMANRR10STD/1757659564939-cropped_1757659556586.jpg",
  },
  {
    partNumber: "AFF/XL/MAN/RR/8(STD)",
    imagePath:
      "products/AFFXLMANRR8STD/1757660704418-cropped_1757660695962.jpg",
  },
  {
    partNumber: "AFF/XL/PRIMA/12(OS-1)",
    imagePath:
      "products/ask/AFF/XL/PRIMA/12(OS-1)/1757418145936-u-cropped_1757418138570.jpg",
  },
  {
    partNumber: "AFF/XL/PRIMA/12(STD)",
    imagePath:
      "products/ask/AFF/XL/PRIMA/12(STD)/1757576591692-u-cropped_1757576585939.jpg",
  },
  {
    partNumber: "AFF/XL/SW/MZ/1(OS-1)",
    imagePath:
      "products/AFFXLSWMZ1OS-1/1757589499864-cropped_1757589452856.jpg",
  },
  {
    partNumber: "AFF/XL/SW/MZ/1(STD)",
    imagePath: "products/AFFXLSWMZ1STD/1757588719822-cropped_1757588714684.jpg",
  },
  {
    partNumber: "AFF/XL/SW/MZ/2(OS-1)",
    imagePath:
      "products/AFFXLSWMZ2OS-1/1757590955665-cropped_1757590947732.jpg",
  },
  {
    partNumber: "AFF/XL/SW/MZ/2(STD)",
    imagePath: "products/AFFXLSWMZ2STD/1757589806140-cropped_1757589658538.jpg",
  },
  {
    partNumber: "AFF/XL/T1109/1(OS-1)",
    imagePath:
      "products/ask/AFF/XL/T1109/1(OS-1)/1757575008651-u-cropped_1757575005467.jpg",
  },
  {
    partNumber: "AFF/XL/T1109/1(OS-2)",
    imagePath:
      "products/ask/AFF/XL/T1109/1(OS-2)/1757574959999-u-cropped_1757574956698.jpg",
  },
  {
    partNumber: "AFF/XL/T1109/1(STD)",
    imagePath:
      "products/ask/AFF/XL/T1109/1(STD)/1757575206785-u-cropped_1757575203872.jpg",
  },
  {
    partNumber: "AFF/XL/T407/1&2(OS-1)",
    imagePath:
      "products/ask/AFF/XL/T407/1&2(OS-1)/1757576132421-u-cropped_1757576129074.jpg",
  },
  {
    partNumber: "AFF/XL/T407/1&2(OS-2)",
    imagePath:
      "products/ask/AFF/XL/T407/1&2(OS-2)/1757576086985-u-cropped_1757576083953.jpg",
  },
  {
    partNumber: "AFF/XL/T407/1&2(STD)",
    imagePath:
      "products/ask/AFF/XL/T407/1&2(STD)/1757576176589-u-cropped_1757576173513.jpg",
  },
  {
    partNumber: "AFF/XL/T608/3&4(OS-1)",
    imagePath:
      "products/ask/AFF/XL/T608/3&4(OS-1)/1757575725635-u-cropped_1757575722669.jpg",
  },
  {
    partNumber: "AFF/XL/T608/3&4(OS-2)",
    imagePath:
      "products/ask/AFF/XL/T608/3&4(OS-2)/1757575683816-u-cropped_1757575678797.jpg",
  },
  {
    partNumber: "AFF/XL/T608/3&4(STD)",
    imagePath:
      "products/ask/AFF/XL/T608/3&4(STD)/1757575777455-u-cropped_1757575773475.jpg",
  },
  {
    partNumber: "AFF/XL/T709/1(OS-1)",
    imagePath:
      "products/ask/AFF/XL/T709/1(OS-1)/1757575625589-u-cropped_1757575622490.jpg",
  },
  {
    partNumber: "AFF/XL/T709/1(OS-2)",
    imagePath:
      "products/ask/AFF/XL/T709/1(OS-2)/1757575514872-u-cropped_1757575511762.jpg",
  },
  {
    partNumber: "AFF/XL/T709/1(STD)",
    imagePath:
      "products/ask/AFF/XL/T709/1(STD)/1757575403778-u-cropped_1757575400740.jpg",
  },
  {
    partNumber: "AFF/XL/T909/1(OS-1)",
    imagePath:
      "products/ask/AFF/XL/T909/1(OS-1)/1757575299694-u-cropped_1757575296059.jpg",
  },
  {
    partNumber: "AFF/XL/T909/1(OS-2)",
    imagePath:
      "products/ask/AFF/XL/T909/1(OS-2)/1757575264398-u-cropped_1757575260396.jpg",
  },
  {
    partNumber: "AFF/XL/T909/1(STD)",
    imagePath:
      "products/ask/AFF/XL/T909/1(STD)/1757575362733-u-cropped_1757575359741.jpg",
  },
  {
    partNumber: "AFF/XL/TBS6(STD)",
    imagePath:
      "products/ask/AFF/XL/TBS6(STD)/1757574922732-u-cropped_1757574919528.jpg",
  },
  {
    partNumber: "AFF/XL/TTS/1(OS-1)",
    imagePath:
      "products/ask/AFF/XL/TTS/1(OS-1)/1757418283826-u-cropped_1757418277862.jpg",
  },
  {
    partNumber: "AFF/XL/TTS/1(STD)",
    imagePath:
      "products/ask/AFF/XL/TTS/1(STD)/1757576542051-u-cropped_1757576540657.jpg",
  },
  {
    partNumber: "AFF/XL/TTS/2(0S-2)",
    imagePath:
      "products/ask/AFF/XL/TTS/2(0S-2)/1757576664997-u-cropped_1757576661354.jpg",
  },
  {
    partNumber: "AFF/XL/TTS/2(OS-1)",
    imagePath:
      "products/ask/AFF/XL/TTS/2(OS-1)/1757577664225-u-cropped_1757577660300.jpg",
  },
  {
    partNumber: "AFF/XL/TTS/2(STD)",
    imagePath:
      "products/ask/AFF/XL/TTS/2(STD)/1757576412145-u-cropped_1757576409340.jpg",
  },
  {
    partNumber: "AFF/XL/WTP/1STD",
    imagePath:
      "products/ask/AFF/XL/WTP/1STD/1757576367327-u-cropped_1757576364436.jpg",
  },
  {
    partNumber: "AFF/XL/WTP/1(OS-1)",
    imagePath:
      "products/ask/AFF/XL/WTP/1(OS-1)/1757576461040-u-cropped_1757576458241.jpg",
  },
  {
    partNumber: "AFF/XL/WTP/2(OS-1)",
    imagePath:
      "products/ask/AFF/XL/WTP/2(OS-1)/1757576220042-u-cropped_1757576217216.jpg",
  },
  {
    partNumber: "AFF/XL/WTP/2(STD)",
    imagePath:
      "products/ask/AFF/XL/WTP/2(STD)/1757576315549-u-cropped_1757576312612.jpg",
  },
  {
    partNumber: "AFF/XL/YK/4551/16(OS-1)",
    imagePath:
      "products/AFFXLYK455116OS-1/1757661126801-cropped_1757661119924.jpg",
  },
  {
    partNumber: "AFF/XL/YK/4551/16(STD)",
    imagePath:
      "products/AFFXLYK455116STD/1757660940898-cropped_1757660928425.jpg",
  },
  {
    partNumber: "AFF/XL/YORK/12(OS-1)",
    imagePath:
      "products/ask/AFF/XL/YORK/12(OS-1)/1757593283151-u-cropped_1757593282052.jpg",
  },
  {
    partNumber: "AFF/XL/YORK/12(STD)",
    imagePath:
      "products/AFFXLYORK12STD/1757591259434-cropped_1757591249457.jpg",
  },
];

let ogFilePaths: string[] = [];
async function listFiles(prefix: string) {
  const [files] = await bucket.getFiles({ prefix });
  files.forEach((file) => {
    console.log(file.name);

    ogFilePaths.push(file.name);
  });
  console.log(ogFilePaths);
}

type AskProduct = {
  partNumber: string;
  imagePath: string;
};

// Build a lookup from normalized original path → askProducts entry
const pathMap = new Map<string, AskProduct>();
for (const p of askProducts) {
  if (!p.imagePath) continue;
  // Normalize both ways the same: no leading "./", no extra slashes
  pathMap.set(p.imagePath, p);
}
// console.log({ pathMap });

let movedCount = 0;
let movedPaths: { partNumber: string; from: string; to: string }[] = [];

async function migrateImages(brandId: string) {
  const [files] = await bucket.getFiles({ prefix: `products/${brandId}/` });

  for (const file of files) {
    // const oldPath = file.name; // e.g. "products/ask/AFF BS6 (8 HOLE LINER)/...
    // const oldPath = `products/ask/${slugifyPartNumber()}`
    // console.log({ oldPath });

    // const product = pathMap.get(oldPath);
    // console.log({ product });

    // if (!product) {
    //   console.warn("No askProducts match for path:", oldPath);
    //   continue;
    // }

    const parts = file.name.split("/"); // e.g. "products/ask/AFF BS6 .../file.jpg"

    const prefix = parts.slice(0, 2).join("/"); // "products/ask"
    const fileName = parts[parts.length - 1]; // last element
    const partNumber = parts.slice(2, -1).join("/"); // everything between

    const slug = slugifyPartNumber(partNumber); // your function

    const newPath = `products/${brandId}/${slug}/${fileName}`;

    if (newPath === file.name) {
      console.log("Already in correct place, skipping:", file.name);
      continue;
    }
    const oldPath = prefix + "/" + partNumber + "/" + fileName;
    console.log(`Moving\n  ${oldPath}\n→ ${newPath}`);

    await file.move(newPath); // atomic rename in the bucket [web:24]
    movedPaths.push({
      partNumber: partNumber,
      from: oldPath,
      to: newPath,
    });
    movedCount++;
  }
  console.log("Moved paths:", movedPaths);
  console.log("✅ Ask images migration complete.", movedCount, "files moved.");
}

listFiles("products/technix/").catch(console.error);
// migrateImages("orbit").catch(console.error);
