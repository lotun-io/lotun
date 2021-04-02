export function uuidToBuffer(uuid: string): Buffer {
  const hexStr = uuid.replace(/-/g, "");
  if (hexStr.length !== 32) {
    throw new Error(`Invalid UUID string: ${uuid}`);
  }
  return Buffer.from(hexStr, "hex");
}

export function uuidToString(buffer: Buffer): string {
  if (buffer.length !== 16) {
    throw new Error(`Invalid buffer length for uuid: ${buffer.length}`);
  }
  const str = buffer.toString("hex");
  return `${str.slice(0, 8)}-${str.slice(8, 12)}-${str.slice(
    12,
    16
  )}-${str.slice(16, 20)}-${str.slice(20)}`;
}
