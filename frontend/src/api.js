import axios from 'axios';
const B = 'http://localhost:5000/api';

export const health          = ()              => axios.get(`${B}/health`);
export const getProjects     = ()              => axios.get(`${B}/projects`);
export const createProject   = (d)             => axios.post(`${B}/projects`, d);
export const updateProject   = (id, d)         => axios.put(`${B}/projects/${id}`, d);
export const deleteProject   = (id)            => axios.delete(`${B}/projects/${id}`);
export const getComponents   = (id)            => axios.get(`${B}/projects/${id}/components`);
export const getRisk         = (id)            => axios.get(`${B}/projects/${id}/risk`);
export const getGraph        = (id)            => axios.get(`${B}/projects/${id}/graph`);
export const getComparison   = ()              => axios.get(`${B}/projects/compare/all`);
export const uploadSBOM      = (id, body, osv) => axios.post(`${B}/sbom/upload/${id}?osv=${osv}`, body);
export const uploadSBOMFile  = (id, form, osv) => axios.post(`${B}/sbom/upload-file/${id}?osv=${osv}`, form, { headers: { 'Content-Type': 'multipart/form-data' } });
export const calcRisk        = (id, osv)       => axios.post(`${B}/risk/calculate/${id}?osv=${osv}`);
export const getBenchmarks   = ()              => axios.get(`${B}/benchmark`);
export const getBenchSummary = ()              => axios.get(`${B}/benchmark/summary`);
export const runBenchmark    = (id, runs)      => axios.post(`${B}/benchmark/run/${id}?runs=${runs}`);
