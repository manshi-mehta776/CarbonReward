import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-lg flex-col items-center justify-center px-4 text-center">
      <h1 className="text-6xl font-extrabold text-brand-600">404</h1>
      <p className="mt-4 text-slate-500">This page doesn't exist — maybe it was recycled.</p>
      <Link to="/" className="btn-primary mt-6">Back home</Link>
    </div>
  );
}
