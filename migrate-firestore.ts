//RUN:: npx tsx migrate-firestore.ts

import admin, { firestore } from "firebase-admin";

// 🔁 Initialize source (DEV)
const sourceApp = admin.initializeApp(
  {
    credential: admin.credential.cert(require("./serviceAccount.prod.json")),
  },
  "prodApp",
);
const sourceDb = sourceApp.firestore();

// ✅ Initialize target (PROD)
const targetApp = admin.initializeApp(
  {
    credential: admin.credential.cert(require("./serviceAccount.dev.json")),
  },
  "devApp",
);
const targetDb = targetApp.firestore();

// 📦 Collections to migrate
const collectionsToMigrate = ["brands", "products", "users"];

async function migrateCollection(collectionName: string) {
  console.log(`🚚 Migrating ${collectionName}...`);
  const snapshot = await sourceDb.collection(collectionName).get();

  const batch = targetDb.batch();
  snapshot.forEach((doc) => {
    const ref = targetDb.collection(collectionName).doc(doc.id);
    batch.set(ref, doc.data());
  });

  await batch.commit();
  console.log(`✅ ${collectionName} migrated (${snapshot.size} documents).`);
}

async function migrateAll() {
  for (const name of collectionsToMigrate) {
    await migrateCollection(name);
  }

  console.log("🎉 All migrations complete.");
}

// migrateAll().catch((err) => {
//   console.error("❌ Migration failed:", err);
// });
async function renameBrandDoc() {
  const oldId = "ask-fras-le";
  const newId = "ask";

  const oldRef = sourceDb.collection("brands").doc(oldId);
  const newRef = sourceDb.collection("brands").doc(newId);

  const snap = await oldRef.get();
  if (!snap.exists) {
    console.error("Old doc does not exist");
    return;
  }

  // Fail fast if new already exists
  const newSnap = await newRef.get();
  if (newSnap.exists) {
    console.error("New doc 'ask' already exists. Aborting.");
    return;
  }

  const data = snap.data();

  // Create new doc with same data (optionally tweak `id` field)
  await newRef.set({
    ...data,
    id: newId, // keep in sync with doc id
  });

  // Delete old doc
  await oldRef.delete();

  console.log("✅ Renamed brands/ask-fras-le → brands/ask");
}

async function replaceHyphensInProducts() {
  const productsCol = sourceDb.collection("products");
  const snapshot = await productsCol.get();

  let updatedCount = 0;

  for (const doc of snapshot.docs) {
    const docId = doc.id;
    if (docId.includes("-")) {
      const newDocId = docId.replace(/-/g, "");
      let data = doc.data();

      // Remove hyphens in id and part_number fields if present
      if (typeof data.id === "string") {
        data.id = data.id.replace(/-/g, "");
      }
      if (typeof data.partNumber === "string") {
        data.partNumber = data.partNumber.replace(/ /g, "");
      }

      // Write to new doc and delete the old one
      await productsCol.doc(newDocId).set(data);
      await doc.ref.delete();

      console.log(`Migrated doc: ${docId} ➔ ${newDocId}`);
      updatedCount++;
    }
  }

  console.log(`✅ All done. ${updatedCount} products updated.`);
}
async function changeFieldInProducts() {
  const productsCol = sourceDb.collection("products");
  const snapshot = await productsCol.get();
  let batch = sourceDb.batch();

  let updatedCount = 0;
  let ops = 0;

  for (const doc of snapshot.docs) {
    const data = doc.data();

    // Example condition: only update if status === "for-sale"
    // Replace with your real condition logic

    // const shouldUpdate = data?.brandId === "accurub" && (data?.partCategory === "V-Rod" || data?.partCategory === "Torque Rod") && data?.partNumber === "Assembly" && data?.gst === 28;
    const shouldUpdate = data?.brandId === "ask";

    console.log(
      `Part Number ${data?.partNumber} shouldUpdate: ${shouldUpdate}`,
    );

    if (shouldUpdate) {
      // Example update: set featured flag and normalize partNumber
      const updates: FirebaseFirestore.UpdateData<{ [field: string]: any }> = {
        brandId: "ask",
      };
      // batch.update(doc.ref, updates);

      updatedCount++;
      ops++;

      // Commit every 450-475 ops to stay under 500 writes/commit
      if (ops >= 450) {
        await batch.commit();
        batch = sourceDb.batch();
        ops = 0;
      }
    }
    if (ops > 0) {
      await batch.commit();
      batch = sourceDb.batch();
      ops = 0;
    }
  }

  console.log(`✅ All done. ${updatedCount} products updated.`);
}
export async function archiveProducts() {
  const db = sourceDb as FirebaseFirestore.Firestore; // ensure admin initialized
  const srcCol = db.collection("products");
  const dstCol = db.collection("archive").doc("products").collection("items"); // Archive/products/items

  const qSnap = await srcCol.where("brandId", "==", "mansarovar").get();

  const MAX = 450; // stay under 500 ops per batch
  let batch = db.batch();
  let ops = 0;
  let moved = 0;

  for (const doc of qSnap.docs) {
    const data = doc.data();

    // 1) write copy in Archive/Product using same id
    const dstRef = dstCol.doc(doc.id);
    batch.set(dstRef, {
      ...data,
      archivedAt: firestore.FieldValue.serverTimestamp(),
    });

    // 2) delete original
    batch.delete(doc.ref);

    ops += 2; // two writes per doc
    moved++;

    if (ops >= MAX) {
      await batch.commit();
      batch = db.batch();
      ops = 0;
    }
  }

  if (ops > 0) {
    await batch.commit();
  }

  console.log(
    `✅ Moved ${moved} product(s) to Archive/Product and deleted originals.`,
  );
}
export async function moveProducts() {
  const db = sourceDb as FirebaseFirestore.Firestore; // ensure admin initialized
  const srcCol = db.collection("archive").doc("products").collection("items"); // Archive/products/items
  const dstCol = db.collection("products");
  const productIdsToMove = [
    "M-904-I",
    "M-905-I",
    "M-907-I",
    "MH-906",
    "MH-908",
    "MH-910",
  ]; // Example IDs to move
  const qSnap = await srcCol.where("id", "in", productIdsToMove).get();

  const MAX = 450; // stay under 500 ops per batch
  let batch = db.batch();
  let ops = 0;
  let moved = 0;

  for (const doc of qSnap.docs) {
    const data = doc.data();

    // 1) write copy in Archive/Product using same id
    const dstRef = dstCol.doc(doc.id);
    batch.set(dstRef, {
      ...data,
    });

    // 2) delete original
    batch.delete(doc.ref);

    ops += 2; // two writes per doc
    moved++;

    if (ops >= MAX) {
      await batch.commit();
      batch = db.batch();
      ops = 0;
    }
  }

  if (ops > 0) {
    await batch.commit();
  }

  console.log(
    `✅ Moved ${moved} product(s) to Archive/Product and deleted originals.`,
  );
}
export async function createMap() {
  const technixFileNames = [
    "1757758277121-u-cropped_1757758275365.jpg",
    "1757758508775-u-cropped_1757758504275.jpg",
    "1757759797930-u-cropped_1757759794110.jpg",
    "1757767937919-u-cropped_1757767935030.jpg",
    "1757925258907-u-cropped_1757925248628.jpg",
    "1758011173251-u-cropped_1758011170806.jpg",
    "1758012170997-u-cropped_1758012166990.jpg",
    "1758016760500-u-cropped_1758016757655.jpg",
    "1758021841052-u-cropped_1758021836138.jpg",
    "1758092325578-u-cropped_1758092322063.jpg",
    "1758093518234-u-cropped_1758093517024.jpg",
    "1758094085901-u-cropped_1758094083267.jpg",
    "1758094252082-u-cropped_1758094246613.jpg",
    "1758095757245-u-cropped_1758095753416.jpg",
    "1758097351638-u-cropped_1758097347529.jpg",
    "1758098096886-u-cropped_1758098095661.jpg",
    "1758103892745-u-cropped_1758103891230.jpg",
    "1758105289942-u-cropped_1758105286645.jpg",
    "1758106673273-u-cropped_1758106668596.jpg",
    "1758116804476-u-cropped_1758116800547.jpg",
    "1758178716437-u-cropped_1758178712863.jpg",
  ];
  const orbitFileNames = [
    "1763539011867-u-cropped_1763539008764.jpg",
    "1763539459810-u-cropped_1763539456394.jpg",
    "1763539702695-u-cropped_1763539692003.jpg",
    "1763539906555-u-cropped_1763539898717.jpg",
    "1763540348998-u-cropped_1763540343321.jpg",
    "1763540601965-u-cropped_1763540596530.jpg",
    "1763540964439-u-cropped_1763540959614.jpg",
    "1763541379823-u-cropped_1763541354149.jpg",
    "1763541671872-u-cropped_1763541667745.jpg",
    "1763541867971-u-cropped_1763541862086.jpg",
    "1763544454680-u-cropped_1763544441034.jpg",
    "1763544582375-u-cropped_1763544569368.jpg",
    "1763544765635-u-cropped_1763544761882.jpg",
    "1763544997457-u-cropped_1763544992940.jpg",
    "1763545281467-u-cropped_1763545278156.jpg",
    "1763545770482-u-cropped_1763545766323.jpg",
    "1763545890287-u-cropped_1763545886552.jpg",
    "1763546340961-u-cropped_1763546336191.jpg",
    "1763546807491-u-cropped_1763546793814.jpg",
    "1763547049227-u-cropped_1763547045802.jpg",
    "1763547233935-u-cropped_1763547228994.jpg",
    "1763547396989-u-cropped_1763547394161.jpg",
    "1763549742266-u-cropped_1763549740021.jpg",
    "1763551064238-u-cropped_1763551045765.jpg",
    "1763553934420-u-cropped_1763553930149.jpg",
    "1763554238811-u-cropped_1763554234448.jpg",
    "1763554425875-u-cropped_1763554419504.jpg",
    "1763554731071-u-cropped_1763554727535.jpg",
    "1763554848888-u-cropped_1763554845157.jpg",
    "1763555044675-u-cropped_1763555031218.jpg",
    "1763621420960-u-cropped_1763621416757.jpg",
    "1763627092530-u-cropped_1763627077774.jpg",
    "1763627552333-u-cropped_1763627544175.jpg",
    "1763627674966-u-cropped_1763627671736.jpg",
    "1763628042185-u-cropped_1763628007099.jpg",
    "1763718513949-u-cropped_1763718487872.jpg",
    "1763719619571-u-cropped_1763719617877.jpg",
    "1763719839244-u-cropped_1763719835890.jpg",
    "1763719978276-u-cropped_1763719972957.jpg",
    "1763720124877-u-cropped_1763720121815.jpg",
    "1763720252737-u-cropped_1763720246223.jpg",
    "1763720665993-u-cropped_1763720656934.jpg",
    "1763727017567-u-cropped_1763727003864.jpg",
    "1763727309519-u-cropped_1763727300513.jpg",
    "1763727472884-u-cropped_1763727468909.jpg",
    "1763727593404-u-cropped_1763727589406.jpg",
    "1763727805265-u-cropped_1763727797556.jpg",
    "1763727939427-u-cropped_1763727927604.jpg",
    "1763728076159-u-cropped_1763728071619.jpg",
    "1763728174315-u-cropped_1763728167454.jpg",
    "1763728352019-u-cropped_1763728348202.jpg",
    "1763728530973-u-cropped_1763728511873.jpg",
    "1763728665118-u-cropped_1763728650056.jpg",
    "1763728943213-u-cropped_1763728936954.jpg",
  ];
  const nxtFileNames = [
    "1758266783973-u-cropped_1758266780609.jpg",
    "1758277214650-u-cropped_1758277211592.jpg",
    "1758278248444-u-cropped_1758278242612.jpg",
    "1758287163780-u-cropped_1758287159723.jpg",
    "1758355082472-u-cropped_1758355078638.jpg",
    "1758629986963-u-cropped_1758629982111.jpg",
    "1758631852001-u-cropped_1758631848507.jpg",
    "1758698111400-u-cropped_1758698105585.jpg",
    "1758698463432-u-cropped_1758698456857.jpg",
    "1758702762757-u-cropped_1758702759505.jpg",
    "1758709444709-u-cropped_1758709441421.jpg",
    "1758716600494-u-cropped_1758716597345.jpg",
    "1758783680602-u-cropped_1758783676700.jpg",
    "1758786535367-u-cropped_1758786532069.jpg",
    "1758788870083-u-cropped_1758788863720.jpg",
    "1758791418207-u-cropped_1758791414845.jpg",
  ];
  const mansarovarFileNames = [
    "1757495928264-u-cropped_1757495925051.jpg",
    "1757497800506-u-cropped_1757497778322.jpg",
    "1757502613792-u-cropped_1757502601892.jpg",
    "1757506047340-u-cropped_1757506019853.jpg",
    "1757510728994-u-cropped_1757510724423.jpg",
    "1757598010942-u-cropped_1757598002189.jpg",
    "1757598055184-u-cropped_1757598051827.jpg",
    "1757663338238-u-cropped_1757663332358.jpg",
    "1757746167983-u-cropped_1757746167540.jpg",
    "1757930842468-u-cropped_1757930830675.jpg",
    "1757931234204-u-cropped_1757931229820.jpg",
    "1757935069882-u-cropped_1757935063305.jpg",
  ];
  const bulldogFileNames = [
    "1758796721315-u-cropped_1758796719663.jpg",
    "1758797653642-u-cropped_1758797650292.jpg",
    "1758802766045-u-cropped_1758802763378.jpg",
  ];
  const autokoiFileNames = [
    "1747836052203-u-Screenshot 2025-05-14 at 19.30.52.png",
    "1750061357930-u-Screenshot 2025-06-16 133804.png",
    "1750068425165-u-Screenshot 2025-06-16 153607.png",
    "1750068766097-u-Screenshot 2025-06-16 154015.png",
    "1750069688136-u-Screenshot 2025-06-16 154015.png",
    "1750070056246-u-Screenshot 2025-06-16 160338.png",
    "1750070188379-u-Screenshot 2025-06-16 160559.png",
    "1750070371562-u-Screenshot 2025-06-16 160850.png",
    "1750070827021-u-Screenshot 2025-06-16 161640.png",
    "1750071058087-u-Screenshot 2025-06-16 162028.png",
    "1750071343897-u-Screenshot 2025-06-16 162517.png",
    "1750071532980-u-Screenshot 2025-06-16 162831.png",
    "1750071930589-u-Screenshot 2025-06-16 163504.png",
    "1750072252381-u-Screenshot 2025-06-16 164027.png",
    "1750072433590-u-Screenshot 2025-06-16 164331.png",
    "1750072657758-u-Screenshot 2025-06-16 164705.png",
    "1750073312461-u-Screenshot 2025-06-16 165801.png",
    "1750074949665-u-Screenshot 2025-06-16 172527.png",
    "1750075310561-u-Screenshot 2025-06-16 173126.png",
    "1750075642734-u-Screenshot 2025-06-16 173612.png",
    "1750076829067-u-Screenshot 2025-06-16 175652.png",
    "1750077421535-u-Screenshot 2025-06-16 180445.png",
    "1750077830755-u-Screenshot 2025-06-16 181328.png",
    "1750078639216-u-Screenshot 2025-06-16 182641.png",
    "1750079027258-u-Screenshot 2025-06-16 183329.png",
    "1750079242872-u-Screenshot 2025-06-16 183658.png",
    "1750079506001-u-Screenshot 2025-06-16 184117.png",
    "1750079761347-u-Screenshot 2025-06-16 184539.png",
    "1750080284970-u-Screenshot 2025-06-16 185415.png",
    "1750080577966-u-Screenshot 2025-06-16 185913.png",
    "1750081607303-u-Screenshot 2025-06-16 191633.png",
    "1750318800710-u-Screenshot 2025-06-19 130847.png",
    "1750319844291-u-Screenshot 2025-06-19 132656.png",
    "1750321061869-u-Screenshot 2025-06-19 134703.png",
    "1750856648654-u-Screenshot 2025-06-25 183231.png",
    "1750936936733-u-Screenshot 2025-06-26 165144.png",
    "1751093456684-u-Screenshot 2025-06-28 121946.png",
    "1751094237609-u-Screenshot 2025-06-28 123308.png",
    "1751096776145-u-Screenshot 2025-06-28 131554.png",
    "1751104662808-u-Screenshot 2025-06-28 152648.png",
    "1751282903657-u-Screenshot 2025-06-30 165759.png",
    "1751285857402-u-product_5.jpg",
    "1751351901526-u-cropped_1751351899411.jpg",
    "1751364738519-u-cropped_1751364731591.jpg",
    "1751367529946-u-cropped_1751367521136.jpg",
    "1751373479375-u-cropped_1751373475329.jpg",
    "1751450034879-u-cropped_1751450031632.jpg",
    "1751527416758-u-cropped_1751527408592.jpg",
    "1751618962093-u-cropped_1751618960360.jpg",
    "1751628542379-u-cropped_1751628527021.jpg",
    "1751698571983-u-cropped_1751698560694.jpg",
    "1752237569652-u-cropped_1752237565707.jpg",
    "1752584601412-u-cropped_1752584596985.jpg",
    "1752649657468-u-cropped_1752649655252.jpg",
    "1752653534727-u-cropped_1752653532189.jpg",
    "1752743668403-u-cropped_1752743665215.jpg",
    "1752747271221-u-cropped_1752747267700.jpg",
    "1753083498890-u-cropped_1753083495549.jpg",
    "1753085509467-u-cropped_1753085503823.jpg",
    "1753182520113-u-cropped_1753182515911.jpg",
    "1753184490395-u-cropped_1753184485768.jpg",
    "1753256294061-u-cropped_1753256283988.jpg",
    "1753265642068-u-cropped_1753265638217.jpg",
    "1753433705394-u-cropped_1753433703866.jpg",
    "1753513643868-u-cropped_1753513640441.jpg",
    "1753519348894-u-cropped_1753519345733.jpg",
    "1753692267909-u-cropped_1753692264424.jpg",
    "1753866114572-u-cropped_1753866110232.jpg",
    "1753882329964-u-cropped_1753882325656.jpg",
    "1753945781018-u-cropped_1753945774449.jpg",
  ];
  const askFileNames = [
    "1757418145936-u-cropped_1757418138570.jpg",
    "1757418283826-u-cropped_1757418277862.jpg",
    "1757574428539-u-cropped_1757574424171.jpg",
    "1757574464982-u-cropped_1757574460314.jpg",
    "1757574501876-u-cropped_1757574498237.jpg",
    "1757574544869-u-cropped_1757574541514.jpg",
    "1757574580488-u-cropped_1757574577010.jpg",
    "1757574612172-u-cropped_1757574608627.jpg",
    "1757574645156-u-cropped_1757574641602.jpg",
    "1757574691482-u-cropped_1757574687148.jpg",
    "1757574744087-u-cropped_1757574739921.jpg",
    "1757574885582-u-cropped_1757574882348.jpg",
    "1757574922732-u-cropped_1757574919528.jpg",
    "1757574959999-u-cropped_1757574956698.jpg",
    "1757575008651-u-cropped_1757575005467.jpg",
    "1757575206785-u-cropped_1757575203872.jpg",
    "1757575264398-u-cropped_1757575260396.jpg",
    "1757575299694-u-cropped_1757575296059.jpg",
    "1757575362733-u-cropped_1757575359741.jpg",
    "1757575403778-u-cropped_1757575400740.jpg",
    "1757575514872-u-cropped_1757575511762.jpg",
    "1757575625589-u-cropped_1757575622490.jpg",
    "1757575683816-u-cropped_1757575678797.jpg",
    "1757575725635-u-cropped_1757575722669.jpg",
    "1757575777455-u-cropped_1757575773475.jpg",
    "1757576086985-u-cropped_1757576083953.jpg",
    "1757576132421-u-cropped_1757576129074.jpg",
    "1757576176589-u-cropped_1757576173513.jpg",
    "1757576220042-u-cropped_1757576217216.jpg",
    "1757576315549-u-cropped_1757576312612.jpg",
    "1757576367327-u-cropped_1757576364436.jpg",
    "1757576412145-u-cropped_1757576409340.jpg",
    "1757576461040-u-cropped_1757576458241.jpg",
    "1757576542051-u-cropped_1757576540657.jpg",
    "1757576591692-u-cropped_1757576585939.jpg",
    "1757576664997-u-cropped_1757576661354.jpg",
    "1757577664225-u-cropped_1757577660300.jpg",
    "1757593283151-u-cropped_1757593282052.jpg",
    "1757658697887-u-cropped_1757658693813.jpg",
  ];
  const accurubFileNames = [
    "1763783273253-u-cropped_1763783270545.jpg",
    "1763794360911-u-cropped_1763794357287.jpg",
    "1763795260319-u-cropped_1763795223305.jpg",
    "1763795632527-u-cropped_1763795630686.jpg",
    "1763796439956-u-cropped_1763796435835.jpg",
    "1763796538425-u-cropped_1763796534902.jpg",
    "1763797288660-u-cropped_1763797285641.jpg",
    "1764061822872-u-cropped_1764061818105.jpg",
    "1764065340029-u-cropped_1764065336429.jpg",
    "1764065712691-u-cropped_1764065701476.jpg",
    "1764065818933-u-cropped_1764065815909.jpg",
    "1764065922011-u-cropped_1764065913576.jpg",
    "1764066041307-u-cropped_1764066034170.jpg",
    "1764066175009-u-cropped_1764066171719.jpg",
    "1764066451797-u-cropped_1764066437163.jpg",
    "1764066548211-u-cropped_1764066545182.jpg",
    "1764066778027-u-cropped_1764066774526.jpg",
    "1764066918914-u-cropped_1764066916296.jpg",
    "1764067109494-u-cropped_1764067100396.jpg",
    "1764067207532-u-cropped_1764067199831.jpg",
    "1764074306283-u-cropped_1764074304329.jpg",
    "1764074364862-u-cropped_1764074360209.jpg",
    "1764074489194-u-cropped_1764074476705.jpg",
    "1764144758415-u-cropped_1764144751473.jpg",
    "1764322841181-u-cropped_1764322837192.jpg",
    "1764322984750-u-cropped_1764322981370.jpg",
    "1764324966361-u-cropped_1764324959094.jpg",
    "1764325076371-u-cropped_1764325072621.jpg",
    "1764325167573-u-cropped_1764325164699.jpg",
    "1764327044855-u-cropped_1764327039139.jpg",
    "1764327221997-u-cropped_1764327203891.jpg",
    "1764327351005-u-cropped_1764327342518.jpg",
    "1764327482242-u-cropped_1764327479524.jpg",
    "1764397836216-u-cropped_1764397827347.jpg",
    "1764398214066-u-cropped_1764398210015.jpg",
    "1764398326217-u-cropped_1764398315296.jpg",
    "1764398461953-u-cropped_1764398458987.jpg",
    "1764398860706-u-cropped_1764398857312.jpg",
    "1764398981012-u-cropped_1764398978097.jpg",
    "1764399186391-u-cropped_1764399181184.jpg",
    "1764399315620-u-cropped_1764399309966.jpg",
    "1764399484438-u-cropped_1764399479329.jpg",
    "1764399927028-u-cropped_1764399921186.jpg",
    "1764400322812-u-cropped_1764400316871.jpg",
    "1764400493020-u-cropped_1764400485838.jpg",
    "1764400859049-u-cropped_1764400851100.jpg",
    "1764402667485-u-cropped_1764402664577.jpg",
    "1764403121261-u-cropped_1764403112056.jpg",
    "1764415475157-u-cropped_1764415467339.jpg",
    "1764416610342-u-cropped_1764416604987.jpg",
    "1764416787519-u-cropped_1764416783732.jpg",
    "1764417272524-u-cropped_1764417244029.jpg",
    "1764417510579-u-cropped_1764417503921.jpg",
    "1764417636100-u-cropped_1764417633431.jpg",
    "1764418138540-u-cropped_1764418133395.jpg",
    "1764418330918-u-cropped_1764418324421.jpg",
    "1764419999107-u-cropped_1764419996004.jpg",
    "1764420182552-u-cropped_1764420177413.jpg",
    "1764420469536-u-cropped_1764420466139.jpg",
    "1764420620885-u-cropped_1764420612642.jpg",
    "1764420745714-u-cropped_1764420742975.jpg",
    "1764582866594-u-cropped_1764582863334.jpg",
    "1764582915673-u-cropped_1764582911947.jpg",
    "1764582981514-u-cropped_1764582978340.jpg",
    "1764583044974-u-cropped_1764583036960.jpg",
    "1764583102350-u-cropped_1764583098867.jpg",
    "1764583176542-u-cropped_1764583161476.jpg",
  ];

  const productsCol = sourceDb.collection("products");
  const snapshot = await productsCol.get();

  // Create Set for O(1) filename lookups
  const filenameSet = new Set(accurubFileNames);

  const fileProductMap: { filename: string; partNumber: string }[] = [];

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const partNumber = data.partNumber;

    const imagePath = data["image"];
    const filename = imagePath?.split("/").pop() || "";
    if (filename) {
      if (filenameSet.has(filename)) {
        fileProductMap.push({ filename, partNumber });
        console.log(`✅ Matched ${filename} → ${partNumber}`);
      }
    }
    // else {
    //   console.log(
    //     `⚠️ No filename found in image path for product ${partNumber}`,
    //   );
    // }
  }

  console.log(
    `🎉 Found ${fileProductMap.length} matches out of ${accurubFileNames.length} files`,
  );
  console.log("Map:", fileProductMap);

  return fileProductMap;
}
async function changeFieldInProductsFromMap() {
  const productsCol = sourceDb.collection("products");
  const snapshot = await productsCol.get();
  let batch = sourceDb.batch();

  let updatedCount = 0;
  let ops = 0;

  // filename ↔ productId map
  const TechnixMap = [
    {
      filename: "1758092325578-u-cropped_1758092322063.jpg",
      productId: "MAL-T2000",
    },
    {
      filename: "1758105289942-u-cropped_1758105286645.jpg",
      productId: "MEG-T1021",
    },
    {
      filename: "1758106673273-u-cropped_1758106668596.jpg",
      productId: "MJE-1000",
    },
    {
      filename: "1758098096886-u-cropped_1758098095661.jpg",
      productId: "MM5-T1002",
    },
    {
      filename: "1758093518234-u-cropped_1758093517024.jpg",
      productId: "MM5-T2000",
    },
    {
      filename: "1758103892745-u-cropped_1758103891230.jpg",
      productId: "MS1-2000",
    },
    {
      filename: "1758012170997-u-cropped_1758012166990.jpg",
      productId: "MS2-T1011",
    },
    {
      filename: "1758016760500-u-cropped_1758016757655.jpg",
      productId: "MS2-T1011A",
    },
    {
      filename: "1758021841052-u-cropped_1758021836138.jpg",
      productId: "MS3-T1001",
    },
    {
      filename: "1758094252082-u-cropped_1758094246613.jpg",
      productId: "MWR-T1001",
    },
    {
      filename: "1758094085901-u-cropped_1758094083267.jpg",
      productId: "MWR-T1002",
    },
    {
      filename: "1757758277121-u-cropped_1757758275365.jpg",
      productId: "RDS-T2100",
    },
    {
      filename: "1757759797930-u-cropped_1757759794110.jpg",
      productId: "RKW-T1012",
    },
    {
      filename: "1757758508775-u-cropped_1757758504275.jpg",
      productId: "RTR-T1002",
    },
    {
      filename: "1758097351638-u-cropped_1758097347529.jpg",
      productId: "TANX-T2100",
    },
    {
      filename: "1758095757245-u-cropped_1758095753416.jpg",
      productId: "TIAG-TGOR",
    },
    {
      filename: "1757767937919-u-cropped_1757767935030.jpg",
      productId: "Y20-T2000",
    },
    {
      filename: "1758011173251-u-cropped_1758011170806.jpg",
      productId: "Y20-T2100",
    },
    {
      filename: "1758116804476-u-cropped_1758116800547.jpg",
      productId: "YCR-T5608",
    },
    {
      filename: "1757925258907-u-cropped_1757925248628.jpg",
      productId: "YIG-T1012",
    },
    {
      filename: "1758178716437-u-cropped_1758178712863.jpg",
      productId: "YSN-T2110",
    },
  ];
  const mergedOrbitMap = [
    {
      filename: "1763539906555-u-cropped_1763539898717.jpg",
      productId: "14BT306445C",
      partNumber: "14BT(306445C)",
    },
    {
      filename: "1763551064238-u-cropped_1763551045765.jpg",
      productId: "1888180WH",
      partNumber: "1888180WH",
    },
    {
      filename: "1763540348998-u-cropped_1763540343321.jpg",
      productId: "22SC",
      partNumber: "22SC",
    },
    {
      filename: "1763540601965-u-cropped_1763540596530.jpg",
      productId: "3527",
      partNumber: "3527",
    },
    {
      filename: "1763540964439-u-cropped_1763540959614.jpg",
      productId: "40106BS6",
      partNumber: "40106/BS6",
    },
    {
      filename: "1763541379823-u-cropped_1763541354149.jpg",
      productId: "40640",
      partNumber: "40640",
    },
    {
      filename: "1763539459810-u-cropped_1763539456394.jpg",
      productId: "44SC",
      partNumber: "44(SC)",
    },
    {
      filename: "1763539011867-u-cropped_1763539008764.jpg",
      productId: "4546SC",
      partNumber: "4546(SC)",
    },
    {
      filename: "1763541671872-u-cropped_1763541667745.jpg",
      productId: "4585",
      partNumber: "4585",
    },
    {
      filename: "1763541867971-u-cropped_1763541862086.jpg",
      productId: "4725SC",
      partNumber: "4725SC",
    },
    {
      filename: "1763544454680-u-cropped_1763544441034.jpg",
      productId: "5052",
      partNumber: "5052",
    },
    {
      filename: "1763539702695-u-cropped_1763539692003.jpg",
      productId: "55TMSC",
      partNumber: "55TM(SC)",
    },
    {
      filename: "1763544582375-u-cropped_1763544569368.jpg",
      productId: "55TPH",
      partNumber: "55TPH",
    },
    {
      filename: "1763627552333-u-cropped_1763627544175.jpg",
      productId: "60112RSWOS",
      partNumber: "60112RSWOS",
    },
    {
      filename: "1763627092530-u-cropped_1763627077774.jpg",
      productId: "60112RSWOS3NUT88011",
      partNumber: "60112RSWOS3NUT(88011)",
    },
    {
      filename: "1763628042185-u-cropped_1763628007099.jpg",
      productId: "6011TWOS",
      partNumber: "6011TWOS",
    },
    {
      filename: "1763627674966-u-cropped_1763627671736.jpg",
      productId: "6011WOSBCT3NUT88011",
      partNumber: "6011WOSBCT3NUT(88011)",
    },
    {
      filename: "1763718513949-u-cropped_1763718487872.jpg",
      productId: "6014WOS",
      partNumber: "6014WOS",
    },
    {
      filename: "1763719619571-u-cropped_1763719617877.jpg",
      productId: "6015WOS",
      partNumber: "6015WOS",
    },
    {
      filename: "1763544765635-u-cropped_1763544761882.jpg",
      productId: "60TM",
      partNumber: "60TM",
    },
    {
      filename: "1763719839244-u-cropped_1763719835890.jpg",
      productId: "6207WOS",
      partNumber: "6207WOS",
    },
    {
      filename: "1763719978276-u-cropped_1763719972957.jpg",
      productId: "6208",
      partNumber: "6208",
    },
    {
      filename: "1763727017567-u-cropped_1763727003864.jpg",
      productId: "62112RS",
      partNumber: "62112RS",
    },
    {
      filename: "1763720252737-u-cropped_1763720246223.jpg",
      productId: "6211WOSMOD",
      partNumber: "6211WOSMOD",
    },
    {
      filename: "1763720124877-u-cropped_1763720121815.jpg",
      productId: "6211WOSMSL",
      partNumber: "6211WOS(MSL)",
    },
    {
      filename: "1763720665993-u-cropped_1763720656934.jpg",
      productId: "6211WOSRSB",
      partNumber: "6211WOS(RSB)",
    },
    {
      filename: "1763727309519-u-cropped_1763727300513.jpg",
      productId: "6213WOSRSB",
      partNumber: "6213WOSRSB",
    },
    {
      filename: "1763544997457-u-cropped_1763544992940.jpg",
      productId: "6544",
      partNumber: "6544",
    },
    {
      filename: "1763545281467-u-cropped_1763545278156.jpg",
      productId: "6638SC",
      partNumber: "6638SC",
    },
    {
      filename: "1763545770482-u-cropped_1763545766323.jpg",
      productId: "6646SC",
      partNumber: "6646SC",
    },
    {
      filename: "1763545890287-u-cropped_1763545886552.jpg",
      productId: "6647",
      partNumber: "6647",
    },
    {
      filename: "1763546340961-u-cropped_1763546336191.jpg",
      productId: "6657",
      partNumber: "6657",
    },
    {
      filename: "1763546807491-u-cropped_1763546793814.jpg",
      productId: "6667SC",
      partNumber: "6667SC",
    },
    {
      filename: "1763549742266-u-cropped_1763549740021.jpg",
      productId: "6676SC",
      partNumber: "6676SC",
    },
    {
      filename: "1763547049227-u-cropped_1763547045802.jpg",
      productId: "6695SC",
      partNumber: "6695SC",
    },
    {
      filename: "1763547233935-u-cropped_1763547228994.jpg",
      productId: "6698SC",
      partNumber: "6698SC",
    },
    {
      filename: "1763727472884-u-cropped_1763727468909.jpg",
      productId: "7240WOS",
      partNumber: "7240WOS",
    },
    {
      filename: "1763554238811-u-cropped_1763554234448.jpg",
      productId: "75750",
      partNumber: "75(750)",
    },
    {
      filename: "1763553934420-u-cropped_1763553930149.jpg",
      productId: "75LH",
      partNumber: "75LH",
    },
    {
      filename: "1763554425875-u-cropped_1763554419504.jpg",
      productId: "75NM750",
      partNumber: "75NM(750)",
    },
    {
      filename: "1763547396989-u-cropped_1763547394161.jpg",
      productId: "75OMSETCO",
      partNumber: "75OMSETCO",
    },
    {
      filename: "1763727805265-u-cropped_1763727797556.jpg",
      productId: "88507WOS-BCT",
      partNumber: "88507WOS-BCT",
    },
    {
      filename: "1763727593404-u-cropped_1763727589406.jpg",
      productId: "88508WOS",
      partNumber: "88508WOS",
    },
    {
      filename: "1763727939427-u-cropped_1763727927604.jpg",
      productId: "88509WOS",
      partNumber: "88509WOS",
    },
    {
      filename: "1763728076159-u-cropped_1763728071619.jpg",
      productId: "88509WOSBCT",
      partNumber: "88509WOSBCT",
    },
    {
      filename: "1763728174315-u-cropped_1763728167454.jpg",
      productId: "88512WOS",
      partNumber: "88512WOS",
    },
    {
      filename: "1763621420960-u-cropped_1763621416757.jpg",
      productId: "88512WOS-BCT",
      partNumber: "88512WOS-BCT",
    },
    {
      filename: "1763728352019-u-cropped_1763728348202.jpg",
      productId: "88513WOS",
      partNumber: "88513WOS",
    },
    {
      filename: "1763728530973-u-cropped_1763728511873.jpg",
      productId: "889123118SPICER",
      partNumber: "88912(3118)SPICER",
    },
    {
      filename: "1763728665118-u-cropped_1763728650056.jpg",
      productId: "88912WOS-BCT",
      partNumber: "88912WOS-BCT",
    },
    {
      filename: "1763554848888-u-cropped_1763554845157.jpg",
      productId: "92AL",
      partNumber: "92AL",
    },
    {
      filename: "1763554731071-u-cropped_1763554727535.jpg",
      productId: "92ALWH",
      partNumber: "92ALWH",
    },
    {
      filename: "1763555044675-u-cropped_1763555031218.jpg",
      productId: "92EMS",
      partNumber: "92EMS",
    },
    {
      filename: "1763728943213-u-cropped_1763728936954.jpg",
      productId: "MSN14",
      partNumber: "MSN14",
    },
  ];
  const nxtMap = [
    {
      filename: "1758266783973-u-cropped_1758266780609.jpg",
      partNumber: "C 05.034",
    },
    {
      filename: "1758277214650-u-cropped_1758277211592.jpg",
      partNumber: "C 17.084",
    },
    {
      filename: "1758278248444-u-cropped_1758278242612.jpg",
      partNumber: "C 17.090",
    },
    {
      filename: "1758287163780-u-cropped_1758287159723.jpg",
      partNumber: "C 17.100",
    },
    {
      filename: "1758355082472-u-cropped_1758355078638.jpg",
      partNumber: "C 17.156",
    },
    {
      filename: "1758629986963-u-cropped_1758629982111.jpg",
      partNumber: "C 19.106",
    },
    {
      filename: "1758631852001-u-cropped_1758631848507.jpg",
      partNumber: "C 19.108",
    },
    {
      filename: "1758698111400-u-cropped_1758698105585.jpg",
      partNumber: "C 19.126",
    },
    {
      filename: "1758698463432-u-cropped_1758698456857.jpg",
      partNumber: "C 19.129",
    },
    {
      filename: "1758702762757-u-cropped_1758702759505.jpg",
      partNumber: "C 19.171",
    },
    {
      filename: "1758716600494-u-cropped_1758716597345.jpg",
      partNumber: "C 20.148",
    },
    {
      filename: "1758709444709-u-cropped_1758709441421.jpg",
      partNumber: "C 20.150",
    },
    {
      filename: "1758783680602-u-cropped_1758783676700.jpg",
      partNumber: "C 20.169",
    },
    {
      filename: "1758786535367-u-cropped_1758786532069.jpg",
      partNumber: "C 20.237",
    },
    {
      filename: "1758788870083-u-cropped_1758788863720.jpg",
      partNumber: "C 20.273",
    },
    {
      filename: "1758791418207-u-cropped_1758791414845.jpg",
      partNumber: "C P20.184",
    },
  ];
  const mansarovarMap = [
    {
      filename: "1757598010942-u-cropped_1757598002189.jpg",
      partNumber: "112",
    },
    {
      filename: "1757598055184-u-cropped_1757598051827.jpg",
      partNumber: "113",
    },
    {
      filename: "1757502613792-u-cropped_1757502601892.jpg",
      partNumber: "203",
    },
    {
      filename: "1757495928264-u-cropped_1757495925051.jpg",
      partNumber: "221",
    },
    {
      filename: "1757497800506-u-cropped_1757497778322.jpg",
      partNumber: "225",
    },
    {
      filename: "1757930842468-u-cropped_1757930830675.jpg",
      partNumber: "806-F",
    },
    {
      filename: "1757931234204-u-cropped_1757931229820.jpg",
      partNumber: "810-F",
    },
    {
      filename: "1757506047340-u-cropped_1757506019853.jpg",
      partNumber: "M-907-I",
    },
    {
      filename: "1757935069882-u-cropped_1757935063305.jpg",
      partNumber: "SMR-8",
    },
  ];
  const bulldogMap = [
    {
      filename: "1758802766045-u-cropped_1758802763378.jpg",
      partNumber: "CLEAR25GM",
    },
    {
      filename: "1758796721315-u-cropped_1758796719663.jpg",
      partNumber: "RED25GM",
    },
  ];
  const autokoiMap = [
    {
      filename: "1753256294061-u-cropped_1753256283988.jpg",
      partNumber: "KFOF12009",
    },
    {
      filename: "1753265642068-u-cropped_1753265638217.jpg",
      partNumber: "KFOF12037",
    },
    {
      filename: "1753182520113-u-cropped_1753182515911.jpg",
      partNumber: "KFTF11004",
    },
    {
      filename: "1753184490395-u-cropped_1753184485768.jpg",
      partNumber: "KFTF11016",
    },
    {
      filename: "1751527416758-u-cropped_1751527408592.jpg",
      partNumber: "KHMF2009",
    },
    {
      filename: "1751618962093-u-cropped_1751618960360.jpg",
      partNumber: "KHMF2026",
    },
    {
      filename: "1751628542379-u-cropped_1751628527021.jpg",
      partNumber: "KHMF2051",
    },
    {
      filename: "1751698571983-u-cropped_1751698560694.jpg",
      partNumber: "KHMF2088",
    },
    {
      filename: "1752747271221-u-cropped_1752747267700.jpg",
      partNumber: "KHSF5065",
    },
    {
      filename: "1752584601412-u-cropped_1752584596985.jpg",
      partNumber: "KMMF3100",
    },
    {
      filename: "1752237569652-u-cropped_1752237565707.jpg",
      partNumber: "KMMF3147",
    },
    {
      filename: "1750080284970-u-Screenshot 2025-06-16 185415.png",
      partNumber: "KMSF1000",
    },
    {
      filename: "1750079761347-u-Screenshot 2025-06-16 184539.png",
      partNumber: "KMSF1001",
    },
    {
      filename: "1750079506001-u-Screenshot 2025-06-16 184117.png",
      partNumber: "KMSF1002",
    },
    {
      filename: "1750075310561-u-Screenshot 2025-06-16 173126.png",
      partNumber: "KMSF1003",
    },
    {
      filename: "1750078639216-u-Screenshot 2025-06-16 182641.png",
      partNumber: "KMSF1004",
    },
    {
      filename: "1750073312461-u-Screenshot 2025-06-16 165801.png",
      partNumber: "KMSF1005",
    },
    {
      filename: "1750072657758-u-Screenshot 2025-06-16 164705.png",
      partNumber: "KMSF1006",
    },
    {
      filename: "1750072433590-u-Screenshot 2025-06-16 164331.png",
      partNumber: "KMSF1007",
    },
    {
      filename: "1750070188379-u-Screenshot 2025-06-16 160559.png",
      partNumber: "KMSF1008",
    },
    {
      filename: "1750071930589-u-Screenshot 2025-06-16 163504.png",
      partNumber: "KMSF1009",
    },
    {
      filename: "1750061357930-u-Screenshot 2025-06-16 133804.png",
      partNumber: "KMSF1010",
    },
    {
      filename: "1750321061869-u-Screenshot 2025-06-19 134703.png",
      partNumber: "KMSF1020",
    },
    {
      filename: "1750318800710-u-Screenshot 2025-06-19 130847.png",
      partNumber: "KMSF1022",
    },
    {
      filename: "1750856648654-u-Screenshot 2025-06-25 183231.png",
      partNumber: "KMSF1034",
    },
    {
      filename: "1750936936733-u-Screenshot 2025-06-26 165144.png",
      partNumber: "KMSF1038",
    },
    {
      filename: "1751094237609-u-Screenshot 2025-06-28 123308.png",
      partNumber: "KMSF1043",
    },
    {
      filename: "1751367529946-u-cropped_1751367521136.jpg",
      partNumber: "KMSF1055",
    },
    {
      filename: "1750077421535-u-Screenshot 2025-06-16 180445.png",
      partNumber: "KMSF1057",
    },
    {
      filename: "1750079242872-u-Screenshot 2025-06-16 183658.png",
      partNumber: "KMSF1058",
    },
    {
      filename: "1750075642734-u-Screenshot 2025-06-16 173612.png",
      partNumber: "KMSF1059",
    },
    {
      filename: "1750072252381-u-Screenshot 2025-06-16 164027.png",
      partNumber: "KMSF1060",
    },
    {
      filename: "1750071532980-u-Screenshot 2025-06-16 162831.png",
      partNumber: "KMSF1061",
    },
    {
      filename: "1750071343897-u-Screenshot 2025-06-16 162517.png",
      partNumber: "KMSF1062",
    },
    {
      filename: "1750071058087-u-Screenshot 2025-06-16 162028.png",
      partNumber: "KMSF1064",
    },
    {
      filename: "1750068766097-u-Screenshot 2025-06-16 154015.png",
      partNumber: "KMSF1065",
    },
    {
      filename: "1750319844291-u-Screenshot 2025-06-19 132656.png",
      partNumber: "KMSF1068",
    },
    {
      filename: "1751096776145-u-Screenshot 2025-06-28 131554.png",
      partNumber: "KMSF1072",
    },
    {
      filename: "1750068425165-u-Screenshot 2025-06-16 153607.png",
      partNumber: "KMSF1079",
    },
    {
      filename: "1750081607303-u-Screenshot 2025-06-16 191633.png",
      partNumber: "KMSF1081",
    },
    {
      filename: "1750080577966-u-Screenshot 2025-06-16 185913.png",
      partNumber: "KMSF1082",
    },
    {
      filename: "1750074949665-u-Screenshot 2025-06-16 172527.png",
      partNumber: "KMSF1083",
    },
    {
      filename: "1750079027258-u-Screenshot 2025-06-16 183329.png",
      partNumber: "KMSF1084",
    },
    {
      filename: "1750076829067-u-Screenshot 2025-06-16 175652.png",
      partNumber: "KMSF1085",
    },
    {
      filename: "1750077830755-u-Screenshot 2025-06-16 181328.png",
      partNumber: "KMSF1086",
    },
    {
      filename: "1750070371562-u-Screenshot 2025-06-16 160850.png",
      partNumber: "KMSF1095",
    },
    {
      filename: "1751104662808-u-Screenshot 2025-06-28 152648.png",
      partNumber: "KMSF1098",
    },
    {
      filename: "1751364738519-u-cropped_1751364731591.jpg",
      partNumber: "KMSF1103",
    },
    {
      filename: "1750070827021-u-Screenshot 2025-06-16 161640.png",
      partNumber: "KMSF1108",
    },
    {
      filename: "1750069688136-u-Screenshot 2025-06-16 154015.png",
      partNumber: "KMSF1112",
    },
    {
      filename: "1750070056246-u-Screenshot 2025-06-16 160338.png",
      partNumber: "KMSF1115",
    },
    {
      filename: "1751282903657-u-Screenshot 2025-06-30 165759.png",
      partNumber: "KMSF1120",
    },
    { filename: "1751285857402-u-product_5.jpg", partNumber: "KMSF1121" },
    {
      filename: "1751093456684-u-Screenshot 2025-06-28 121946.png",
      partNumber: "KMSF1128",
    },
    {
      filename: "1751351901526-u-cropped_1751351899411.jpg",
      partNumber: "KMSF1132",
    },
    {
      filename: "1751373479375-u-cropped_1751373475329.jpg",
      partNumber: "KMSF1137",
    },
    {
      filename: "1751450034879-u-cropped_1751450031632.jpg",
      partNumber: "KMSF2001",
    },
    {
      filename: "1753433705394-u-cropped_1753433703866.jpg",
      partNumber: "KRPF14075",
    },
    {
      filename: "1753513643868-u-cropped_1753513640441.jpg",
      partNumber: "KRPF14129",
    },
    {
      filename: "1753866114572-u-cropped_1753866110232.jpg",
      partNumber: "KRPF14188",
    },
    {
      filename: "1753882329964-u-cropped_1753882325656.jpg",
      partNumber: "KRPF14250",
    },
    {
      filename: "1753519348894-u-cropped_1753519345733.jpg",
      partNumber: "KRPF14271",
    },
    {
      filename: "1753692267909-u-cropped_1753692264424.jpg",
      partNumber: "KRPF14318",
    },
    {
      filename: "1753945781018-u-cropped_1753945774449.jpg",
      partNumber: "KRPF14609",
    },
    {
      filename: "1753083498890-u-cropped_1753083495549.jpg",
      partNumber: "KTAF10008",
    },
    {
      filename: "1753085509467-u-cropped_1753085503823.jpg",
      partNumber: "KTAF10062",
    },
    {
      filename: "1752653534727-u-cropped_1752653532189.jpg",
      partNumber: "KTMF4008",
    },
    {
      filename: "1752649657468-u-cropped_1752649655252.jpg",
      partNumber: "KTMF4051",
    },
  ];
  const askMap = [
    {
      filename: "1757574885582-u-cropped_1757574882348.jpg",
      partNumber: "AFF BS6 (8 HOLE LINER)",
    },
    {
      filename: "1757658697887-u-cropped_1757658693813.jpg",
      partNumber: "AFF/XL/AL/TP/ALS/3&4 (OS-1)",
    },
    {
      filename: "1757574744087-u-cropped_1757574739921.jpg",
      partNumber: "AFF/XL/AL/TP/SM/1&2(STD)",
    },
    {
      filename: "1757574691482-u-cropped_1757574687148.jpg",
      partNumber: "AFF/XL/AL/TP/SM/3 & 4 (STD)",
    },
    {
      filename: "1757574645156-u-cropped_1757574641602.jpg",
      partNumber: "AFF/XL/AL/TP/SM/3&4(OS-1)",
    },
    {
      filename: "1757574612172-u-cropped_1757574608627.jpg",
      partNumber: "AFF/XL/AL/TP/SM/3&4(OS-2)",
    },
    {
      filename: "1757574580488-u-cropped_1757574577010.jpg",
      partNumber: "AFF/XL/AL/TP/SM/3&4(OS-3)",
    },
    {
      filename: "1757574428539-u-cropped_1757574424171.jpg",
      partNumber: "AFF/XL/AL/TP/SM/7&8 (OS-2)",
    },
    {
      filename: "1757574544869-u-cropped_1757574541514.jpg",
      partNumber: "AFF/XL/AL/TP/SM/7&8 (STD)",
    },
    {
      filename: "1757574464982-u-cropped_1757574460314.jpg",
      partNumber: "AFF/XL/AL/TP/SM/7&8(OS-1)",
    },
    {
      filename: "1757574501876-u-cropped_1757574498237.jpg",
      partNumber: "AFF/XL/AL/TP/SM/7&8(STD)",
    },
    {
      filename: "1757418145936-u-cropped_1757418138570.jpg",
      partNumber: "AFF/XL/PRIMA/12(OS-1)",
    },
    {
      filename: "1757576591692-u-cropped_1757576585939.jpg",
      partNumber: "AFF/XL/PRIMA/12(STD)",
    },
    {
      filename: "1757575008651-u-cropped_1757575005467.jpg",
      partNumber: "AFF/XL/T1109/1(OS-1)",
    },
    {
      filename: "1757574959999-u-cropped_1757574956698.jpg",
      partNumber: "AFF/XL/T1109/1(OS-2)",
    },
    {
      filename: "1757575206785-u-cropped_1757575203872.jpg",
      partNumber: "AFF/XL/T1109/1(STD)",
    },
    {
      filename: "1757576132421-u-cropped_1757576129074.jpg",
      partNumber: "AFF/XL/T407/1&2(OS-1)",
    },
    {
      filename: "1757576086985-u-cropped_1757576083953.jpg",
      partNumber: "AFF/XL/T407/1&2(OS-2)",
    },
    {
      filename: "1757576176589-u-cropped_1757576173513.jpg",
      partNumber: "AFF/XL/T407/1&2(STD)",
    },
    {
      filename: "1757575725635-u-cropped_1757575722669.jpg",
      partNumber: "AFF/XL/T608/3&4(OS-1)",
    },
    {
      filename: "1757575683816-u-cropped_1757575678797.jpg",
      partNumber: "AFF/XL/T608/3&4(OS-2)",
    },
    {
      filename: "1757575777455-u-cropped_1757575773475.jpg",
      partNumber: "AFF/XL/T608/3&4(STD)",
    },
    {
      filename: "1757575625589-u-cropped_1757575622490.jpg",
      partNumber: "AFF/XL/T709/1(OS-1)",
    },
    {
      filename: "1757575514872-u-cropped_1757575511762.jpg",
      partNumber: "AFF/XL/T709/1(OS-2)",
    },
    {
      filename: "1757575403778-u-cropped_1757575400740.jpg",
      partNumber: "AFF/XL/T709/1(STD)",
    },
    {
      filename: "1757575299694-u-cropped_1757575296059.jpg",
      partNumber: "AFF/XL/T909/1(OS-1)",
    },
    {
      filename: "1757575264398-u-cropped_1757575260396.jpg",
      partNumber: "AFF/XL/T909/1(OS-2)",
    },
    {
      filename: "1757575362733-u-cropped_1757575359741.jpg",
      partNumber: "AFF/XL/T909/1(STD)",
    },
    {
      filename: "1757574922732-u-cropped_1757574919528.jpg",
      partNumber: "AFF/XL/TBS6(STD)",
    },
    {
      filename: "1757418283826-u-cropped_1757418277862.jpg",
      partNumber: "AFF/XL/TTS/1(OS-1)",
    },
    {
      filename: "1757576542051-u-cropped_1757576540657.jpg",
      partNumber: "AFF/XL/TTS/1(STD)",
    },
    {
      filename: "1757576664997-u-cropped_1757576661354.jpg",
      partNumber: "AFF/XL/TTS/2(0S-2)",
    },
    {
      filename: "1757577664225-u-cropped_1757577660300.jpg",
      partNumber: "AFF/XL/TTS/2(OS-1)",
    },
    {
      filename: "1757576412145-u-cropped_1757576409340.jpg",
      partNumber: "AFF/XL/TTS/2(STD)",
    },
    {
      filename: "1757576367327-u-cropped_1757576364436.jpg",
      partNumber: "AFF/XL/WTP/1STD",
    },
    {
      filename: "1757576461040-u-cropped_1757576458241.jpg",
      partNumber: "AFF/XL/WTP/1(OS-1)",
    },
    {
      filename: "1757576220042-u-cropped_1757576217216.jpg",
      partNumber: "AFF/XL/WTP/2(OS-1)",
    },
    {
      filename: "1757576315549-u-cropped_1757576312612.jpg",
      partNumber: "AFF/XL/WTP/2(STD)",
    },
    {
      filename: "1757593283151-u-cropped_1757593282052.jpg",
      partNumber: "AFF/XL/YORK/12(OS-1)",
    },
  ];
  const accurubMap = [
    {
      filename: "1764327351005-u-cropped_1764327342518.jpg",
      partNumber: "120.1100.01",
    },
    {
      filename: "1764327482242-u-cropped_1764327479524.jpg",
      partNumber: "120.1100.02",
    },
    {
      filename: "1764402667485-u-cropped_1764402664577.jpg",
      partNumber: "120.1200.04",
    },
    {
      filename: "1764400859049-u-cropped_1764400851100.jpg",
      partNumber: "120.1200.08",
    },
    {
      filename: "1764400493020-u-cropped_1764400485838.jpg",
      partNumber: "120.1200.09",
    },
    {
      filename: "1764400322812-u-cropped_1764400316871.jpg",
      partNumber: "120.1200.10",
    },
    {
      filename: "1764399186391-u-cropped_1764399181184.jpg",
      partNumber: "120.1200.11",
    },
    {
      filename: "1764399315620-u-cropped_1764399309966.jpg",
      partNumber: "120.1200.12",
    },
    {
      filename: "1764399484438-u-cropped_1764399479329.jpg",
      partNumber: "120.1200.13",
    },
    {
      filename: "1764399927028-u-cropped_1764399921186.jpg",
      partNumber: "120.1200.14",
    },
    {
      filename: "1764398981012-u-cropped_1764398978097.jpg",
      partNumber: "120.1200.15",
    },
    {
      filename: "1764398860706-u-cropped_1764398857312.jpg",
      partNumber: "120.1200.16",
    },
    {
      filename: "1764398461953-u-cropped_1764398458987.jpg",
      partNumber: "120.1200.17",
    },
    {
      filename: "1764398326217-u-cropped_1764398315296.jpg",
      partNumber: "120.1200.60",
    },
    {
      filename: "1764398214066-u-cropped_1764398210015.jpg",
      partNumber: "120.1200.61",
    },
    {
      filename: "1764397836216-u-cropped_1764397827347.jpg",
      partNumber: "120.1200.62",
    },
    {
      filename: "1764327221997-u-cropped_1764327203891.jpg",
      partNumber: "120.1300.01",
    },
    {
      filename: "1764327044855-u-cropped_1764327039139.jpg",
      partNumber: "120.1400.01",
    },
    {
      filename: "1764325076371-u-cropped_1764325072621.jpg",
      partNumber: "120.1700.01",
    },
    {
      filename: "1764325167573-u-cropped_1764325164699.jpg",
      partNumber: "120.1700.02",
    },
    {
      filename: "1764066548211-u-cropped_1764066545182.jpg",
      partNumber: "120.1700.026",
    },
    {
      filename: "1764324966361-u-cropped_1764324959094.jpg",
      partNumber: "120.1700.03",
    },
    {
      filename: "1764322984750-u-cropped_1764322981370.jpg",
      partNumber: "120.1700.04",
    },
    {
      filename: "1764066918914-u-cropped_1764066916296.jpg",
      partNumber: "120.1700.06",
    },
    {
      filename: "1764322841181-u-cropped_1764322837192.jpg",
      partNumber: "120.1700.07",
    },
    {
      filename: "1764144758415-u-cropped_1764144751473.jpg",
      partNumber: "120.1700.09",
    },
    {
      filename: "1764067207532-u-cropped_1764067199831.jpg",
      partNumber: "120.1700.15",
    },
    {
      filename: "1764067109494-u-cropped_1764067100396.jpg",
      partNumber: "120.1700.16",
    },
    {
      filename: "1764066778027-u-cropped_1764066774526.jpg",
      partNumber: "120.1700.17",
    },
    {
      filename: "1764066451797-u-cropped_1764066437163.jpg",
      partNumber: "120.1700.27",
    },
    {
      filename: "1763794360911-u-cropped_1763794357287.jpg",
      partNumber: "120.207.02",
    },
    {
      filename: "1763783273253-u-cropped_1763783270545.jpg",
      partNumber: "120.207.03",
    },
    {
      filename: "1764061822872-u-cropped_1764061818105.jpg",
      partNumber: "120.207.05",
    },
    {
      filename: "1764415475157-u-cropped_1764415467339.jpg",
      partNumber: "120.207.145",
    },
    {
      filename: "1764583176542-u-cropped_1764583161476.jpg",
      partNumber: "120.207.32",
    },
    {
      filename: "1764583102350-u-cropped_1764583098867.jpg",
      partNumber: "120.207.33",
    },
    {
      filename: "1764583044974-u-cropped_1764583036960.jpg",
      partNumber: "120.207.34",
    },
    {
      filename: "1764582981514-u-cropped_1764582978340.jpg",
      partNumber: "120.207.41",
    },
    {
      filename: "1764582915673-u-cropped_1764582911947.jpg",
      partNumber: "120.207.42",
    },
    {
      filename: "1764582866594-u-cropped_1764582863334.jpg",
      partNumber: "120.207.44",
    },
    {
      filename: "1764420745714-u-cropped_1764420742975.jpg",
      partNumber: "120.207.45",
    },
    {
      filename: "1764420620885-u-cropped_1764420612642.jpg",
      partNumber: "120.207.46",
    },
    {
      filename: "1764420469536-u-cropped_1764420466139.jpg",
      partNumber: "120.207.50",
    },
    {
      filename: "1764420182552-u-cropped_1764420177413.jpg",
      partNumber: "120.207.51",
    },
    {
      filename: "1764419999107-u-cropped_1764419996004.jpg",
      partNumber: "120.207.52",
    },
    {
      filename: "1764418330918-u-cropped_1764418324421.jpg",
      partNumber: "120.207.54",
    },
    {
      filename: "1764418138540-u-cropped_1764418133395.jpg",
      partNumber: "120.207.55",
    },
    {
      filename: "1764417636100-u-cropped_1764417633431.jpg",
      partNumber: "120.207.56",
    },
    {
      filename: "1764417510579-u-cropped_1764417503921.jpg",
      partNumber: "120.207.57",
    },
    {
      filename: "1764417272524-u-cropped_1764417244029.jpg",
      partNumber: "120.207.60",
    },
    {
      filename: "1764416787519-u-cropped_1764416783732.jpg",
      partNumber: "120.207.61",
    },
    {
      filename: "1763797288660-u-cropped_1763797285641.jpg",
      partNumber: "120.2800.02",
    },
    {
      filename: "1764066041307-u-cropped_1764066034170.jpg",
      partNumber: "120.2800.03",
    },
    {
      filename: "1764065922011-u-cropped_1764065913576.jpg",
      partNumber: "120.301.09",
    },
    {
      filename: "1764066175009-u-cropped_1764066171719.jpg",
      partNumber: "120.400.01",
    },
    {
      filename: "1764065340029-u-cropped_1764065336429.jpg",
      partNumber: "120.400.02",
    },
    {
      filename: "1764403121261-u-cropped_1764403112056.jpg",
      partNumber: "120.400.04",
    },
    {
      filename: "1764065712691-u-cropped_1764065701476.jpg",
      partNumber: "120.400.05",
    },
    {
      filename: "1764065818933-u-cropped_1764065815909.jpg",
      partNumber: "120.400.06",
    },
    {
      filename: "1763795260319-u-cropped_1763795223305.jpg",
      partNumber: "120.400.08",
    },
    {
      filename: "1764074364862-u-cropped_1764074360209.jpg",
      partNumber: "120.700.02",
    },
    {
      filename: "1764416610342-u-cropped_1764416604987.jpg",
      partNumber: "120.7000.27",
    },
    {
      filename: "1764074306283-u-cropped_1764074304329.jpg",
      partNumber: "120.700.04",
    },
    {
      filename: "1763796439956-u-cropped_1763796435835.jpg",
      partNumber: "120.700.06",
    },
    {
      filename: "1763796538425-u-cropped_1763796534902.jpg",
      partNumber: "120.700.07",
    },
    {
      filename: "1764074489194-u-cropped_1764074476705.jpg",
      partNumber: "120.700.08",
    },
    {
      filename: "1763795632527-u-cropped_1763795630686.jpg",
      partNumber: "120.700.09",
    },
  ];

  // Build lookup: partNumber -> filename
  const productToFilename = new Map<string, string>();
  for (const { filename, partNumber } of accurubMap) {
    productToFilename.set(partNumber, filename);
  }

  for (const doc of snapshot.docs) {
    const data = doc.data();
    const brandId = data?.brandId;
    const partNumber = data?.partNumber as string | undefined;

    // Only brandName + partNumber present in BrandMap
    const shouldUpdate =
      brandId === "accurub" &&
      typeof partNumber === "string" &&
      productToFilename.has(partNumber);

    console.log(`Part Number ${partNumber} shouldUpdate: ${shouldUpdate}`);

    if (!shouldUpdate) continue;

    const filename = productToFilename.get(partNumber)!;
    const newPath = `products/accurub/${partNumber}/${filename}`;

    const updates: FirebaseFirestore.UpdateData<{ [field: string]: any }> = {
      image: newPath,
    };

    batch.update(doc.ref, updates);
    updatedCount++;
    ops++;

    // Commit every ~450 ops
    if (ops >= 450) {
      await batch.commit();
      batch = sourceDb.batch();
      ops = 0;
    }
  }

  // Final pending batch
  if (ops > 0) {
    await batch.commit();
  }

  console.log(`✅ All done. ${updatedCount} products updated.`);
}

// Usage
// renameBrandDoc().catch(console.error);
// replaceHyphensInProducts().catch(console.error);
// changeFieldInProducts().catch(console.error);
// archiveProducts().catch(console.error);
// moveProducts().catch(console.error);
// createMap().catch(console.error);
changeFieldInProductsFromMap().catch(console.error);
