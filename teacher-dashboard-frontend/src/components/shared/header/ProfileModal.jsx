import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { FiUser, FiLogOut } from "react-icons/fi";
import BASE_URL from '../../../config/apiConfig';
import { clearToken, getToken, getUserId, getUserName } from '@/utils/token';

const ProfileModal = () => {
    const navigate = useNavigate();
    const userName = getUserName() || "User";
    const [profileImage, setProfileImage] = useState('');

    useEffect(() => {
        const fetchProfileImage = async () => {
            try {
                const token = getToken();
                const userId = getUserId();
                if (!token || !userId) return;

                const { data } = await axios.get(`${BASE_URL}/users/${userId}`, {
                    headers: { Authorization: `Bearer ${token}` },
                });
                setProfileImage(data?.faceImgUrl || '');
            } catch (error) {
                console.error('Failed to load profile image:', error);
            }
        };

        fetchProfileImage();
    }, []);

    const avatarSrc = profileImage || "/images/avatar/1.png";
    const avatarStyle = { width: 40, height: 40, objectFit: 'cover' };

    const handleLogout = () => {
        clearToken(); // Clear all token info
        navigate('/authentication/login/creative'); // Redirect
    };

    return (
        <div className="dropdown nxl-h-item">
            <a href="#" data-bs-toggle="dropdown" role="button" data-bs-auto-close="outside">
                <img src={avatarSrc} alt="user-image" className="img-fluid user-avtar me-0" style={avatarStyle} />
            </a>
            <div className="dropdown-menu dropdown-menu-end nxl-h-dropdown nxl-user-dropdown">
                <div className="dropdown-header">
                    <div className="d-flex align-items-center">
                        <img src={avatarSrc} alt="user-image" className="img-fluid user-avtar" style={avatarStyle} />
                        <div>
                            <h6 className="text-dark mb-0">{userName}<span className="badge bg-soft-success text-success ms-1">PRO</span></h6>
                            {/* <span className="fs-12 fw-medium text-muted">alex.della@outlook.com</span> */}
                        </div>
                    </div>
                    
                </div>
                
                <Link to="/admin/profile" className="dropdown-item">
                    <i><FiUser /></i>
                    <span>Profile Details</span>
                </Link>

                {/* <a href="#" className="dropdown-item">
                    <i><FiSettings /></i>
                    <span>Account Settings</span>
                </a> */}

                <div className="dropdown-divider"></div>

                <button onClick={handleLogout} className="dropdown-item" style={{ background: 'none', border: 'none', width: '100%', textAlign: 'start' }}>
                    <i><FiLogOut /></i>
                    <span>Logout</span>
                </button>
            </div>
        </div>
    );
};

export default ProfileModal;
