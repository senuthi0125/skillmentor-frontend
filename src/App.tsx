import { BrowserRouter, Routes, Route } from "react-router";
import Layout from "@/components/Layout";
import HomePage from "@/pages/HomePage";
import LoginPage from "@/pages/LoginPage";
import DashboardPage from "@/pages/DashboardPage";
import PaymentPage from "@/pages/PaymentPage";
import MentorProfilePage from "@/pages/MentorProfilePage";
import AdminLayout from "@/components/admin/AdminLayout";
import AdminOverviewPage from "./components/admin/AdminOverviewPage";
import ManageBookingsPage from "./components/admin/ManageBookingsPage";
import CreateMentorPage from "./components/admin/CreateMentorPage";
import CreateSubjectPage from "./components/admin/CreateSubjectPage";
import { SignedIn, SignedOut } from "@clerk/clerk-react";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/admin" element={<AdminLayout />}>
          <Route index element={<AdminOverviewPage />} />
          <Route path="bookings" element={<ManageBookingsPage />} />
          <Route path="mentors/create" element={<CreateMentorPage />} />
          <Route path="subjects/create" element={<CreateSubjectPage />} />
        </Route>

        <Route
          path="/"
          element={
            <Layout>
              <HomePage />
            </Layout>
          }
        />

        <Route
          path="/login"
          element={
            <Layout>
              <LoginPage />
            </Layout>
          }
        />

        <Route
          path="/mentors/:mentorId"
          element={
            <Layout>
              <MentorProfilePage />
            </Layout>
          }
        />

        <Route
          path="/dashboard"
          element={
            <Layout>
              <SignedIn>
                <DashboardPage />
              </SignedIn>
              <SignedOut>
                <LoginPage />
              </SignedOut>
            </Layout>
          }
        />

        <Route
          path="/payment/:sessionId"
          element={
            <Layout>
              <SignedIn>
                <PaymentPage />
              </SignedIn>
              <SignedOut>
                <LoginPage />
              </SignedOut>
            </Layout>
          }
        />

        <Route
          path="*"
          element={
            <Layout>
              <LoginPage />
            </Layout>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;