export type Event = {
  id: string;
  images: { is_primary: boolean; url: string }[];
  latitude: number;
  location_name: string;
  longitude: number;
  start_time: string;
  title: string;
  description: string;
  distance_km: number;
  host: {
    id: string;
    instagram_handle: string;
    location: string;
    name: string;
    website: string;
    phone_number: string;
    logo: string;
  };
  filters: { id: string; name: string }[];
};