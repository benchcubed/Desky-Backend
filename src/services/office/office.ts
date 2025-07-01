import { PutCommand } from "@aws-sdk/lib-dynamodb";
import { ddbDocClient } from "../../clients/ddb";
import { CreateOfficeRequest, createOfficeSchema, Office } from "../../models/officeSchma";
import { v4 as uuid } from "uuid";
import { createS3Directory as createS3Object } from "../../utils/s3Utils";

const OFFICES_TABLE_NAME = process.env.OFFICES_TABLE_NAME || "";
const OFFICES_S3_BUCKET_NAME = process.env.OFFICES_S3_BUCKET_NAME || "";

export const saveOffice = async (data: Office): Promise<Office> => {
    const params = {
        TableName: OFFICES_TABLE_NAME,
        Item: data,
        ConditionExpression: "attribute_not_exists(id)",
        // Prevent overwrite if office exists
    };
    const parsedData = createOfficeSchema.safeParse(data);
    if (!parsedData.success) {
        console.error("Invalid office data:", parsedData.error);
        throw new Error("Invalid office data");
    }

    const response = await ddbDocClient.send(new PutCommand(params));
    if (response.$metadata.httpStatusCode !== 200) {
        console.error("Error saving office data:", response);
        throw new Error("Error saving office data");
    }

    await createS3Object(`offices/${data.id}/README.md`,
        `# Office ${data.id}\n\nThis directory contains data related to the office with ID: ${data.id}.`,
        OFFICES_S3_BUCKET_NAME || "desky-offices",
        "text/markdown");
    // Generate basic Minecraft office and save to S3
    // This is a placeholder function that should be implemented to generate the office layout
    // For now, it will just create a basic office layout with a desk and some blocks
    console.log(`Generating basic Minecraft office for office ID: ${data.id}`);
    await generateBasicMinecraftOfficeAndSaveToS3(data.id);

    return data;
};

const generateBasicMinecraftOfficeAndSaveToS3 = async (officeId: string): Promise<string> => {
    const content = {
        title: `Office ${officeId}`,
        metadata: {
            officeId,
            createdBy: "system",
            version: "1.0",
            createdAt: new Date().toISOString(),
            lastModified: new Date().toISOString(),
            createdByName: "Desky System",
            createdByEmail: "support@desky.com",
            officeType: "basic",
            preset: null, // No preset for basic office
        },
        description: `This is a basic Minecraft office setup for office ID: ${officeId}.`,
        officeCorner: { x: 0, y: 0, z: 0 },
        blocks: Array.from(generateFancyDeskBlocks()),
    }

    return createS3Object(`offices/${officeId}/floorplan.mcdata.json`, JSON.stringify(content), OFFICES_S3_BUCKET_NAME, "application/json");
}

// !!! TEMP TEMP TEMP !!!
function* generateFancyDeskBlocks(): Generator<{ type: string, position: { x: number, y: number, z: number }, properties?: Record<string, any> }> {
    // Desk surface: 4 blocks wide oak planks at y=2
    for (let x = 0; x < 4; x++) {
        yield {
            type: "minecraft:oak_planks",
            position: { x, y: 2, z: 0 },
            properties: { hardness: 2.0 }
        };
    }

    // Desk legs: polished stone bricks at y=0 and y=1 for a chunkier leg
    const legPositions = [0, 3];
    for (const x of legPositions) {
        yield {
            type: "minecraft:polished_stone_bricks",
            position: { x, y: 0, z: 0 },
            properties: { hardness: 1.8 }
        };
        yield {
            type: "minecraft:polished_stone_bricks",
            position: { x, y: 1, z: 0 },
            properties: { hardness: 1.8 }
        };
    }

    // Middle leg: polished stone brick column 2 blocks high for extra support
    yield {
        type: "minecraft:polished_stone_bricks",
        position: { x: 1, y: 0, z: 0 },
        properties: { hardness: 1.8 }
    };
    yield {
        type: "minecraft:polished_stone_bricks",
        position: { x: 1, y: 1, z: 0 },
        properties: { hardness: 1.8 }
    };

    // Drawer: trapdoor right under the desk surface at x=2, y=1, z=0
    yield {
        type: "minecraft:oak_trapdoor",
        position: { x: 2, y: 1, z: 0 },
        properties: { hardness: 1.0, open: false }
    };

    // Lanterns on the desk corners at y=3, z=0
    for (const x of [0, 3]) {
        yield {
            type: "minecraft:lantern",
            position: { x, y: 3, z: 0 },
            properties: { lightLevel: 15 }
        };
    }

    // Bookshelf blocks as desk accessories at y=2, z=1 (just behind desk surface)
    for (let x = 0; x < 4; x++) {
        yield {
            type: "minecraft:bookshelf",
            position: { x, y: 2, z: 1 },
            properties: { hardness: 1.5 }
        };
    }
}