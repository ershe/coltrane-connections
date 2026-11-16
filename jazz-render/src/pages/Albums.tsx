import { useEffect, useState } from "react";
import type { Album } from "../types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function Albums() {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/albums")
      .then((res) => res.json())
      .then((data) => {
        setAlbums(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch albums:", err);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="p-6">Loading catalog...</div>;

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">John Coltrane Discography</h1>

      {/* Responsive CSS Grid: 1 column on mobile, 2 on tablet, 3 on desktop */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {albums.map((album) => (
          <Card key={album.id} className="flex flex-col justify-between">
            <CardHeader>
              <div className="flex justify-between items-start gap-4">
                <CardTitle className="text-lg leading-tight">
                  {album.title}
                </CardTitle>
                <Badge variant={album.is_leader ? "default" : "secondary"}>
                  {album.is_leader ? "Leader" : "Sideman"}
                </Badge>
              </div>
              <CardDescription>
                {album.release_year || "Unknown Year"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500 font-medium">{album.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
