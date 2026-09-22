import axios from 'axios';

const BASE = 'http://localhost:5000/api';

export const getProjects    = ()             => axios.get(`${BASE}/projects`);
export const createProject  = (data)         => axios.post(`${BASE}/projects`, data);
export const getProject     = (id)           => axios.get(`${BASE}/projects/${id}`);
export const getComponents  = (id)           => axios.get(`${BASE}/projects/${id}/components`);
export const getRisk        = (id)           => axios.get(`${BASE}/projects/${id}/risk`);
export const uploadSBOM     = (projectId, sbom) => axios.post(`${BASE}/sbom/upload/${projectId}`, sbom);
export const calculateRisk  = (projectId)    => axios.post(`${BASE}/risk/calculate/${projectId}`);
export const deleteProject  = (id)           => axios.delete(`${BASE}/projects/${id}`);
export const healthCheck    = ()             => axios.get(`${BASE}/health`);
