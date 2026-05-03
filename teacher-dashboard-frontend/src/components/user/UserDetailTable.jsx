import React, { useEffect, useState } from 'react';
import CardHeader from '@/components/shared/CardHeader';
import CardLoader from '@/components/shared/CardLoader';
import useCardTitleActions from '@/hooks/useCardTitleActions';
import axios from 'axios';
import BASE_URL from '../../config/apiConfig';
import { getToken } from '@/utils/token';
import { BsArrowLeft, BsArrowRight, BsDot } from 'react-icons/bs';
import { Link } from 'react-router-dom';
import Swal from 'sweetalert2';

const UserDetailTable = ({ title }) => {
  const [users, setUsers] = useState([]);

  const {
    refreshKey,
    isRemoved,
    isExpanded,
    handleRefresh,
    handleExpand,
    handleDelete,
  } = useCardTitleActions();

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedUsers = users.slice(startIndex, endIndex);

  const authHeaders = () => {
    const token = getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  const fetchUsers = async () => {
    try {
      const userRes = await axios.get(`${BASE_URL}/users`, { headers: authHeaders() });
      const data = Array.isArray(userRes.data) ? userRes.data : [];
      setUsers(data);
    } catch (err) {
      console.error('Failed to load users', err);
      Swal.fire('Error', 'Failed to load users.', 'error');
    }
  };


  if (isRemoved) return null;

  const totalPages = Math.max(1, Math.ceil(users.length / itemsPerPage));

  // helper to render suitability badge
  const SuitabilityBadge = ({ value }) => {
    // assuming 1 = suitable, 0 = not suitable (adjust if your API differs)
    const isSuitable = Number(value) === 1;
    const text = isSuitable ? 'Suitable' : 'Not Suitable';
    const cls = isSuitable ? 'bg-soft-success text-success' : 'bg-soft-warning text-warning';
    return <span className={`badge ${cls}`}>{text}</span>;
  };

  return (
    <div className="col-xxl-12">
      <div
        className={`card stretch stretch-full ${isExpanded ? 'card-expand' : ''} ${refreshKey ? 'card-loading' : ''
          }`}
      >
        <CardHeader title={title} refresh={handleRefresh} remove={handleDelete} expanded={handleExpand} />

        <div className="card-body custom-card-action p-0">
          <div className="table-responsive" style={{ minHeight: "350px" }}>
            <table className="table table-hover mb-0">
              <thead>
                <tr>
                  <th style={{ display: 'none' }}>ID</th>
                  <th>Name</th>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Entrance Test</th>
                  {/* <th>Suitable Method</th>         NEW */}
                  <th>Difficulty Level</th>        {/* NEW */}
                  <th>Role</th>
                </tr>
              </thead>
              <tbody>
                {paginatedUsers.length === 0 ? (
                  <tr>
                    {/* 9 visible columns now */}
                    <td colSpan={9} className="text-center py-4">
                      No users found.
                    </td>
                  </tr>
                ) : (
                  paginatedUsers.map((user) => {
                    const fullName =
                      `${user.firstName || user.firstname || ''} ${user.lastName || user.lastname || ''}`.trim() ||
                      '-';
                    const username = user.username || '-';
                    const email = user.email || '-';
                    const phone = user.phoneNumber || user.contactNumber || '-';
                    const entrance = Number(user.entranceTest) === 1 ? 'Completed' : 'Pending';
                    const roleName = user?.role?.name || 'User';
                    const isAdmin = roleName.toLowerCase().includes('admin');

                    const difficultyLevel = user?.difficultyLevel || '-';

                    return (
                      <tr key={user._id} className={isAdmin ? 'table-light' : ''}>
                        <td style={{ display: 'none' }}>{user._id}</td>
                        <td>{fullName}</td>
                        <td>{username}</td>
                        <td>{email}</td>
                        <td>{phone}</td>
                        <td>
                          {isAdmin ? (
                            <span className="text-muted">Not applicable</span>
                          ) : (
                            <span
                              className={`badge ${entrance === 'Completed'
                                ? 'bg-soft-success text-success'
                                : 'bg-soft-warning text-warning'
                                }`}
                            >
                              {entrance}
                            </span>
                          )}
                        </td>

                        {/* NEW: Suitable Method */}
                        {/* <td>{suitableMethod}</td> */}

                        {/* NEW: Difficulty Level */}
                        <td>{difficultyLevel}</td>

                        {/* Role (read-only) */}
                        <td>{roleName}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card-footer">
          <ul className="list-unstyled d-flex align-items-center gap-2 mb-0 pagination-common-style">
            <li>
              <Link
                to="#"
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                className={currentPage === 1 ? 'disabled' : ''}
              >
                <BsArrowLeft size={16} />
              </Link>
            </li>

            {Array.from({ length: totalPages }, (_, index) => {
              const page = index + 1;
              const shouldShow =
                page === 1 || page === totalPages || Math.abs(currentPage - page) <= 1;

              if (!shouldShow && (page === 2 || page === totalPages - 1)) {
                return (
                  <li key={`dots-${index}`}>
                    <Link to="#" onClick={(e) => e.preventDefault()}>
                      <BsDot size={16} />
                    </Link>
                  </li>
                );
              }

              return shouldShow ? (
                <li key={index}>
                  <Link
                    to="#"
                    onClick={() => setCurrentPage(page)}
                    className={currentPage === page ? 'active' : ''}
                  >
                    {page}
                  </Link>
                </li>
              ) : null;
            })}

            <li>
              <Link
                to="#"
                onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                className={currentPage === totalPages ? 'disabled' : ''}
              >
                <BsArrowRight size={16} />
              </Link>
            </li>
          </ul>
        </div>

        <CardLoader refreshKey={refreshKey} />
      </div>
    </div>
  );
};

export default UserDetailTable;

