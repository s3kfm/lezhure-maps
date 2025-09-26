import Map from '@/components/map';

export default function MapPage() {
  return (
    <div className="w-full h-screen">
      <div className="bg-white shadow-sm border-b p-4">
        <h1 className="text-2xl font-bold text-gray-900">Los Angeles Events Map</h1>
        <p className="text-gray-600 mt-1">Discover events happening around Los Angeles</p>
      </div>
      <div className="h-[calc(100vh-80px)]">
        <Map />
      </div>
    </div>
  );
}
