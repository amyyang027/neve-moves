import { db } from "@/lib/db";

// Serves the generated poster as a real SVG file so you can open it in a new
// tab and save it (right-click → Save image as…).
export async function GET(
  _req: Request,
  { params }: RouteContext<"/projects/[id]/poster/svg">,
) {
  const { id } = await params;
  const project = await db.project.findUnique({
    where: { id },
    select: { posterSvg: true },
  });

  if (!project?.posterSvg) {
    return new Response("No poster generated yet", { status: 404 });
  }

  return new Response(project.posterSvg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Content-Disposition": 'inline; filename="neve-moves-poster.svg"',
    },
  });
}
