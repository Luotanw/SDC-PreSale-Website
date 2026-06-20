// Columns for a stored order, in order. Shared by every storage backend so the
// CSV file and the Google Sheet always use the same schema. "id" identifies an
// order so edits update the same row instead of appending a new one.
export const FIELDS = [
  "id",
  "timestamp",
  "name",
  "email",
  "phone",
  "quantity",
  "price",
  "total",
  "pickup",
  "notes",
];
