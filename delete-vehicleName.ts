import admin from "firebase-admin";

interface DeleteResult {
  totalProcessed: number;
  vehicleNameDeleted: number;
  hadVehicleName: string[];
  errors: string[];
}

/**
 * 🔧 DELETE vehicleName field from products collection
 * - Targets the 82 items identified in your report
 * - Safe batch processing (500 docs per batch)
 * - Dry-run option available
 */
export async function deleteVehicleNameField(
  dryRun: boolean = true,
): Promise<DeleteResult> {
  try {
    const sourceApp = admin.initializeApp(
      {
        credential: admin.credential.cert(
          require("./serviceAccount.prod.json"),
        ),
      },
      "deleteVehicleNameApp",
    );
    const sourceDb = sourceApp.firestore();

    console.log(
      `🗑️  Starting vehicleName cleanup ${dryRun ? "(DRY RUN)" : "(LIVE)"}...`,
    );

    const productsRef = sourceDb.collection("products");
    const snapshot = await productsRef.get();

    const result: DeleteResult = {
      totalProcessed: 0,
      vehicleNameDeleted: 0,
      hadVehicleName: [],
      errors: [],
    };

    // Process in batches of 500 (Firestore limit)
    const batchSize = 500;
    let batchCount = 0;

    for (let i = 0; i < snapshot.docs.length; i += batchSize) {
      const batchDocs = snapshot.docs.slice(i, i + batchSize);
      const batch = sourceDb.batch();
      let batchDeleted = 0;

      console.log(
        `📦 Processing batch ${batchCount + 1} (${batchDocs.length} docs)...`,
      );

      for (const doc of batchDocs) {
        const data = doc.data();
        result.totalProcessed++;

        // Check if document has vehicleName field
        if ("vehicleName" in data && data.vehicleName !== undefined) {
          result.hadVehicleName.push(doc.id);

          if (dryRun) {
            console.log(`👀 [DRY] Would delete vehicleName from: ${doc.id}`);
          } else {
            // Delete only the vehicleName field
            batch.update(doc.ref, {
              vehicleName: admin.firestore.FieldValue.delete(),
            });
            batchDeleted++;
            result.vehicleNameDeleted++;
          }
        }
      }

      // Commit batch (only if LIVE mode)
      if (!dryRun && batchDeleted > 0) {
        await batch.commit();
        console.log(
          `✅ Batch ${batchCount + 1}: Deleted vehicleName from ${batchDeleted} docs`,
        );
      }

      batchCount++;
    }

    console.log("\n📊 FINAL RESULTS:");
    console.log(`Total products scanned: ${result.totalProcessed}`);
    console.log(`Products with vehicleName: ${result.hadVehicleName.length}`);
    console.log(`vehicleName deleted: ${result.vehicleNameDeleted}`);
    console.log(`Errors: ${result.errors.length}`);

    if (dryRun) {
      console.log("\n🚨 DRY RUN COMPLETE - No changes made to database");
      console.log("✅ Run again with dryRun: false to apply changes");
    } else {
      console.log("\n✅ LIVE CLEANUP COMPLETE - vehicleName field removed");
    }

    return result;
  } catch (error) {
    console.error("❌ Cleanup failed:", error);
    throw error;
  }
}

// 🚀 USAGE EXAMPLES:

// 1. FIRST: Run DRY RUN to confirm
// console.log("\n=== DRY RUN: Check what would be deleted ===");
// deleteVehicleNameField(true)
//   .then((result) => {
//     console.table(result);
//     console.log(
//       `\nFound ${result.hadVehicleName.length} products with vehicleName field`,
//     );
//     console.log("✅ Looks good? Run LIVE below...");
//   })
//   .catch(console.error);

// 2. THEN: Run LIVE (uncomment when ready)
console.log("\n=== LIVE: Delete vehicleName field ===");
deleteVehicleNameField(false)
  .then(result => {
    console.table(result);
    console.log("✅ vehicleName field cleanup COMPLETE!");
  })
  .catch(console.error);
