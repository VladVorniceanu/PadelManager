export const LOCATIONS_COLLECTION = 'locations';

export function mapLocation(doc) {
  if (!doc.exists) return null;
  const data = doc.data();

  return {
    id: doc.id,
    name: data.name,
    address: data.address,
    city: data.city,
    courts: data.courts || [],
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
    isActive: data.isActive ?? true
  };
}