export const LOCATIONS_COLLECTION = 'locations';

export function mapLocation(doc) {
  const data = doc.data();

  return {
    id: doc.id,
    name: data.name,
    address: data.address,
    city: data.city,
    courts: data.courts || [],
    createdAt: data.createdAt?.toDate?.() ?? null,
    updatedAt: data.updatedAt?.toDate?.() ?? null,
  };
}