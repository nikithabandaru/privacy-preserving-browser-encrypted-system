from pymongo import MongoClient

uri = "mongodb+srv://bandarunikitha97_db_user:fYQ64JGXeVExdQsj@cluster0.k9ffzz7.mongodb.net/dams?retryWrites=true&w=majority&appName=Cluster0"
client = MongoClient(uri)
db = client['dams']

print("=== CHECKING MONGODB ATLAS ===")
print("Connected to cluster successfully!\n")

print("1. Checking Asset Metadata (Database entries):")
metadata = list(db.assetMetadata.find())
print(f"Total files recorded in database: {len(metadata)}")
for doc in metadata:
    print(f" - File: {doc.get('originalFileName')}")
    print(f"   Category: {doc.get('category')}")
    print(f"   Encrypted: {doc.get('encryptedAtRest')}")
    print(f"   GridFS ID: {doc.get('mongoFileId')}")
    print("")

print("2. Checking Encrypted Files (GridFS storage):")
# GridFS uses fs.files and fs.chunks collections by default
fs_files = list(db['fs.files'].find())
print(f"Total physical encrypted files stored: {len(fs_files)}")
for f in fs_files:
    print(f" - GridFS File ID: {f.get('_id')}")
    print(f"   Stored Filename: {f.get('filename')}")
    print(f"   Encrypted Size: {f.get('length')} bytes")
    print(f"   Upload Date: {f.get('uploadDate')}")
    print("")

client.close()
