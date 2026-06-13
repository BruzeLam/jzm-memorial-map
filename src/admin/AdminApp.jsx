import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { LanguageProvider } from '../i18n/LanguageContext';
import AdminLogin from './AdminLogin';
import AdminLayout from './AdminLayout';
import AdminDashboard from './AdminDashboard';
import AdminMarkers from './AdminMarkers';
import AdminMarkerEdit from './AdminMarkerEdit';
import AdminCollaborators from './AdminCollaborators';
import AdminReview from './AdminReview';

export default function AdminApp() {
  return (
    <LanguageProvider>
      <Routes>
        <Route path="login" element={<AdminLogin />} />
        <Route element={<AdminLayout />}>
          <Route index element={<AdminDashboard />} />
          <Route path="markers" element={<AdminMarkers />} />
          <Route path="markers/new" element={<AdminMarkerEdit />} />
          <Route path="markers/:id" element={<AdminMarkerEdit />} />
          <Route path="collaborators" element={<AdminCollaborators />} />
          <Route path="review" element={<AdminReview />} />
        </Route>
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    </LanguageProvider>
  );
}
