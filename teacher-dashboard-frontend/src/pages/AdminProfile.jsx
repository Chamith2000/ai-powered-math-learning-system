import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';
import PageHeader from '@/components/shared/pageHeader/PageHeader';
import BASE_URL from '../config/apiConfig';
import { getToken, getUserId } from '@/utils/token';

const AdminProfile = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    faceImgUrl: '',
    role: 'Admin', // Usually read-only
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  // Fetch profile data on mount
  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    try {
      const token = getToken();
      const userId = getUserId();
      const response = await axios.get(`${BASE_URL}/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Assuming your API returns the user object directly or inside 'data'
      const user = response.data?.user || response.data; 
      
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phoneNumber: user.phoneNumber || '',
        faceImgUrl: user.faceImgUrl || '',
        role: user?.role?.name || user.role || 'Admin',
      });
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      Swal.fire('Error', 'Could not load profile data.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFieldChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const token = getToken();
      const userId = getUserId();
      await axios.put(`${BASE_URL}/users/${userId}`, {
        firstName: formData.firstName,
        lastName: formData.lastName,
        phoneNumber: formData.phoneNumber,
        faceImgUrl: formData.faceImgUrl,
      }, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json' 
        }
      });
      
      Swal.fire({
        icon: 'success',
        title: 'Updated!',
        text: 'Your profile has been updated successfully.',
        timer: 2000,
        showConfirmButton: false,
      });
    } catch (error) {
      console.error('Failed to update profile:', error);
      Swal.fire('Error', error?.response?.data?.message || 'Failed to update profile.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <>
        <PageHeader />
        <div className="main-content">
          <div className="text-center py-5">Loading profile...</div>
        </div>
      </>
    );
  }

  const initials = `${formData.firstName?.[0] || ''}${formData.lastName?.[0] || ''}`.trim() || 'A';

  return (
    <>
      <PageHeader />
      <div className="main-content">
        <div className="row g-4">
          {/* Left Column: Avatar & Quick Info */}
          <div className="col-xl-4 col-lg-5">
            <div className="card text-center p-4 h-100">
              <div className="card-body">
                <div className="mb-4">
                  {formData.faceImgUrl ? (
                    <img
                      src={formData.faceImgUrl}
                      alt="Admin profile"
                      className="rounded-circle mx-auto shadow-sm"
                      style={{ width: '130px', height: '130px', objectFit: 'cover' }}
                    />
                  ) : (
                    <div
                      className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center mx-auto"
                      style={{ width: '130px', height: '130px', fontSize: '42px', fontWeight: 700 }}
                    >
                      {initials}
                    </div>
                  )}
                </div>
                <h4 className="mb-1">{formData.firstName} {formData.lastName}</h4>
                <p className="text-muted mb-3">{formData.role}</p>
                <span className="badge bg-success-subtle text-success px-3 py-2">Active Account</span>
              </div>
            </div>
          </div>

          {/* Right Column: Edit Form */}
          <div className="col-xl-8 col-lg-7">
            <div className="card h-100">
              <div className="card-header">
                <h5 className="mb-0">Edit Profile Details</h5>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="card-body">
                  <div className="row g-3">
                    
                    <div className="col-md-6">
                      <label className="form-label">First Name</label>
                      <input
                        type="text"
                        className="form-control"
                        name="firstName"
                        value={formData.firstName}
                        onChange={handleFieldChange}
                        required
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label">Last Name</label>
                      <input
                        type="text"
                        className="form-control"
                        name="lastName"
                        value={formData.lastName}
                        onChange={handleFieldChange}
                        required
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label">Email Address</label>
                      <input
                        type="email"
                        className="form-control"
                        name="email"
                        value={formData.email}
                        disabled
                      />
                    </div>

                    <div className="col-md-6">
                      <label className="form-label">Phone Number</label>
                      <input
                        type="text"
                        className="form-control"
                        name="phoneNumber"
                        value={formData.phoneNumber}
                        onChange={handleFieldChange}
                      />
                    </div>

                    <div className="col-md-12">
                      <label className="form-label">Profile Image URL</label>
                      <input
                        type="url"
                        className="form-control"
                        name="faceImgUrl"
                        value={formData.faceImgUrl}
                        onChange={handleFieldChange}
                        placeholder="https://..."
                      />
                    </div>

                    <div className="col-md-12">
                      <label className="form-label">Role</label>
                      <input
                        type="text"
                        className="form-control"
                        name="role"
                        value={formData.role}
                        disabled
                      />
                      <small className="text-muted">Contact system admin to change roles.</small>
                    </div>

                  </div>
                </div>
                <div className="card-footer d-flex justify-content-end">
                  <button type="submit" className="btn btn-primary" disabled={isSaving}>
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AdminProfile;
