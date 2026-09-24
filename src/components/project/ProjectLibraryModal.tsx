'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  FolderArchive,
  Plus,
  Download,
  Upload,
  Trash2,
  ExternalLink,
  X,
  CheckCircle2,
  AlertCircle,
  FileJson,
  Calendar,
  Layers,
  Sparkles,
  MapPin,
  Clock
} from 'lucide-react';
import { ProjectState, SavedProjectSummary } from '@/types/project';
import {
  getProjectSummaries,
  loadProject,
  deleteProject,
  saveProject,
  exportProjectAsJson,
  importProjectFromJson,
  importGeoJsonBoundary
} from '@/lib/project/projectStorage';
import { SelectedLocation, SitePolygon } from '@/types/geo';

interface ProjectLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentProject: ProjectState | null;
  onLoadProject: (project: ProjectState) => void;
  onImportBoundary?: (polygon: SitePolygon) => void;
}

export const ProjectLibraryModal: React.FC<ProjectLibraryModalProps> = ({
  isOpen,
  onClose,
  currentProject,
  onLoadProject,
  onImportBoundary
}) => {
  const [projects, setProjects] = useState<SavedProjectSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'MY_PROJECTS' | 'IMPORT'>('MY_PROJECTS');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const refreshList = async () => {
    setLoading(true);
    try {
      const summaries = await getProjectSummaries();
      setProjects(summaries);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      refreshList();
      setErrorMessage(null);
      setSuccessMessage(null);
    }
  }, [isOpen]);

  const handleOpenProject = async (id: string) => {
    setLoading(true);
    try {
      const proj = await loadProject(id);
      if (proj) {
        onLoadProject(proj);
        onClose();
      } else {
        setErrorMessage('Project could not be found or opened');
      }
    } catch (e: any) {
      setErrorMessage(e.message || 'Error opening project');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this saved project?')) return;
    await deleteProject(id);
    await refreshList();
  };

  const handleExport = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const proj = await loadProject(id);
    if (proj) {
      exportProjectAsJson(proj);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const text = event.target?.result as string;
        if (!text) return;

        // Try importing as complete Urban Ecology Compiler Project JSON
        try {
          const importedProject = importProjectFromJson(text);
          await saveProject(importedProject);
          await refreshList();
          setSuccessMessage(`Successfully imported project: "${importedProject.name}"`);
          setTimeout(() => {
            onLoadProject(importedProject);
            onClose();
          }, 800);
          return;
        } catch (projErr) {
          // If not complete project, try importing as raw GeoJSON Site Polygon boundary
          if (onImportBoundary && currentProject) {
            const polygon = importGeoJsonBoundary(text, currentProject.location.name);
            onImportBoundary(polygon);
            setSuccessMessage('Successfully imported site polygon boundary from GeoJSON');
            setTimeout(onClose, 800);
            return;
          }
          throw projErr;
        }
      } catch (err: any) {
        setErrorMessage(`Failed to import file: ${err.message || 'Invalid format'}`);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fade-in select-none">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-800">
              <FolderArchive className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 leading-tight">
                Project Library & Workspace
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Saved ecological synthesis projects and spatial imports
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-2xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs & Actions */}
        <div className="px-6 py-3 border-b border-slate-100 flex items-center justify-between gap-3 bg-white">
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100">
            <button
              onClick={() => setActiveTab('MY_PROJECTS')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                activeTab === 'MY_PROJECTS'
                  ? 'bg-white text-emerald-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Saved Projects ({projects.length})
            </button>
            <button
              onClick={() => setActiveTab('IMPORT')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === 'IMPORT'
                  ? 'bg-white text-emerald-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Upload className="w-3 h-3" />
              <span>Import Plan / GeoJSON</span>
            </button>
          </div>

          {currentProject && (
            <button
              onClick={() => {
                exportProjectAsJson(currentProject);
              }}
              className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Export Current</span>
            </button>
          )}
        </div>

        {/* Status Alerts */}
        {errorMessage && (
          <div className="mx-6 mt-4 p-3 rounded-2xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
        {successMessage && (
          <div className="mx-6 mt-4 p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {activeTab === 'MY_PROJECTS' && (
            <div className="space-y-3">
              {projects.length === 0 ? (
                <div className="py-12 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                    <FolderArchive className="w-6 h-6" />
                  </div>
                  <div>
                    <h5 className="text-sm font-bold text-slate-700">No saved projects yet</h5>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                      Compile your site plan and click &quot;Save Project&quot; in the header to preserve it in your persistent library.
                    </p>
                  </div>
                </div>
              ) : (
                projects.map((proj) => (
                  <div
                    key={proj.id}
                    onClick={() => handleOpenProject(proj.id)}
                    className="group p-4 rounded-2xl border border-slate-200 hover:border-emerald-500 bg-white hover:bg-emerald-50/30 transition shadow-sm cursor-pointer flex items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-slate-900 truncate group-hover:text-emerald-900 transition">
                          {proj.name}
                        </h4>
                        {proj.isDemo && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 font-bold">
                            DEMO
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                        <span className="flex items-center gap-1 text-slate-700 font-medium">
                          <MapPin className="w-3 h-3 text-emerald-600" />
                          <span className="truncate">{proj.locationName}</span>
                        </span>
                        <span>•</span>
                        <span className="font-mono font-semibold text-slate-800">
                          {proj.siteAreaHa.toFixed(2)} ha
                        </span>
                        <span>•</span>
                        <span className="text-emerald-700 font-medium">
                          {proj.interventionCount} interventions
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1 text-slate-400">
                          <Clock className="w-3 h-3" />
                          <span>{new Date(proj.updatedAt).toLocaleDateString()}</span>
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={(e) => handleExport(proj.id, e)}
                        className="p-2 rounded-xl text-slate-400 hover:text-emerald-800 hover:bg-white transition border border-transparent hover:border-slate-200"
                        title="Download Project JSON"
                      >
                        <Download className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => handleDelete(proj.id, e)}
                        className="p-2 rounded-xl text-slate-400 hover:text-red-700 hover:bg-white transition border border-transparent hover:border-slate-200"
                        title="Delete project"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'IMPORT' && (
            <div className="space-y-4">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="p-8 rounded-3xl border-2 border-dashed border-emerald-400/80 bg-emerald-50/40 hover:bg-emerald-50/70 transition text-center cursor-pointer space-y-3"
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept=".json,.geojson,.uec.json"
                  className="hidden"
                />
                <div className="w-12 h-12 rounded-2xl bg-white shadow-sm border border-emerald-200 flex items-center justify-center mx-auto text-emerald-700">
                  <FileJson className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    Upload Urban Ecology Project or GeoJSON Boundary
                  </h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                    Accepts <span className="font-mono text-emerald-800">.uec.json</span> compiled plans or <span className="font-mono text-emerald-800">.geojson</span> site polygon boundaries.
                  </p>
                </div>
                <button
                  type="button"
                  className="px-4 py-2 rounded-xl bg-emerald-800 text-white font-bold text-xs shadow-md shadow-emerald-900/10 hover:bg-emerald-900 transition"
                >
                  Browse Files
                </button>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600 space-y-1.5">
                <span className="font-bold text-slate-800">Geospatial Validation Guarantee:</span>
                <p>
                  Imported geometries are strictly validated with Turf.js. Area, perimeter, and vertex statistics are automatically computed from genuine spherical coordinates.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
