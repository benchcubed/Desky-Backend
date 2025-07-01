import { CreateBucketCommand, HeadBucketCommand, HeadObjectCommand, PutObjectCommand, PutObjectCommandInput } from "@aws-sdk/client-s3";
import { s3Client } from "../clients/s3";

async function createBucketIfNotExists(bucketName: string) {
    try {
        // Check if bucket exists by sending HeadBucket command
        await s3Client.send(new HeadBucketCommand({ Bucket: bucketName }));
        console.log(`Bucket "${bucketName}" already exists.`);
    } catch (error: any) {
        if (error.name === "NotFound" || error.$metadata?.httpStatusCode === 404) {
            // Bucket doesn't exist, create it
            await s3Client.send(new CreateBucketCommand({ Bucket: bucketName }));
            console.log(`Bucket "${bucketName}" created.`);
        } else {
            // Other errors (e.g. forbidden, network)
            console.error(`Error checking bucket existence:`, error);
            throw error;
        }
    }
}

export async function createS3Directory(key: string, content: any, bucketName: string, contentType: string): Promise<string> {
    if (!key || !content || !bucketName || !contentType) {
        throw new Error("Missing required parameters: key, content, bucketName, or contentType");
    }
    await createBucketIfNotExists(bucketName);
    try {
        await s3Client.send(new HeadObjectCommand({
            Bucket: bucketName,
            Key: key,
        }));

        // If HeadObjectCommand succeeds, README exists
        throw new Error(`${key} already exists at ${bucketName}`);
    } catch (err) {
        console.log(`README does not exist at ${key}, proceeding to create it.`);
    }

    const putParams: PutObjectCommandInput = {
        Bucket: bucketName,
        Key: key,
        Body: content,
        ContentType: contentType,
    };

    await s3Client.send(new PutObjectCommand(putParams));

    return key; // return the path/key for reference
}
