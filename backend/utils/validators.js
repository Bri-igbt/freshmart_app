export const isNonEmptyString = (value) =>
  typeof value === "string" && value.trim() !== "";

export const hasValidImage = (image) =>
  isNonEmptyString(image?.url) && isNonEmptyString(image?.public_id);
