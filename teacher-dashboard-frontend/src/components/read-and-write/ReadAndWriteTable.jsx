import React, { useEffect, useState } from 'react';
import CardHeader from '@/components/shared/CardHeader';
import CardLoader from '@/components/shared/CardLoader';
import useCardTitleActions from '@/hooks/useCardTitleActions';
import Dropdown from '@/components/shared/Dropdown';
import axios from 'axios';
import BASE_URL from '../../config/apiConfig';
import { getToken } from '@/utils/token';
import { BsArrowLeft, BsArrowRight, BsDot } from 'react-icons/bs';
import { FiEdit3, FiTrash2, FiEye } from 'react-icons/fi';
import { Link, useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';

const ReadAndWriteTable = ({ title }) => {
  const navigate = useNavigate();

  const [items, setItems] = useState([]);

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
  const paginated = items.slice(startIndex, endIndex);

  useEffect(() => {
    fetchReadWrites();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey]);

  const fetchReadWrites = async () => {
    try {
      const token = getToken();
      const res = await axios.get(`${BASE_URL}/readwrite/learning`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = Array.isArray(res.data) ? res.data : [];
      setItems(data);
    } catch (err) {
      console.error('Failed to load read & write items', err);
      Swal.fire('Error', 'Failed to load read & write items.', 'error');
    }
  };

  const handleDeletes = async (id) => {
    const confirm = await Swal.fire({
      title: 'Are you sure?',
      text: "You won't be able to revert this!",
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#6c757d',
      confirmButtonText: 'Yes, delete it!',
    });

    if (confirm.isConfirmed) {
      try {
        const token = getToken();
        await axios.delete(`${BASE_URL}/readwrite/learning/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        Swal.fire('Deleted!', 'Read & write item has been deleted.', 'success');
        fetchReadWrites();
      } catch (err) {
        Swal.fire('Error!', 'Failed to delete read & write item.', 'error');
      }
    }
  };

  const handleActionClick = (action, row) => {
    if (action === 'Delete') {
      handleDeletes(row._id);
    } else if (action === 'Edit') {
      navigate(`/admin/read-and-write/edit/${row._id}`);
    } else if (action === 'View') {
      navigate(`/admin/read-and-write/view/${row._id}`);
    }
  };

  const getDropdownItems = (row) => [
    {
      icon: <FiEye />,
      label: 'View Details',
      onClick: () => handleActionClick('View', row),
    },
    {
      icon: <FiEdit3 />,
      label: 'Edit',
      onClick: () => handleActionClick('Edit', row),
    },
    { type: 'divider' },
    {
      icon: <FiTrash2 />,
      label: 'Delete',
      onClick: () => handleActionClick('Delete', row),
    },
  ];

  if (isRemoved) return null;

  const totalPages = Math.max(1, Math.ceil(items.length / itemsPerPage));

  return (
    <div className="col-xxl-12">
      <div
        className={`card stretch stretch-full ${isExpanded ? 'card-expand' : ''} ${
          refreshKey ? 'card-loading' : ''
        }`}
      >
        <CardHeader
          title={title}
          refresh={handleRefresh}
          remove={handleDelete}
          expanded={handleExpand}
        />

        <div className="card-body custom-card-action p-0">
          <div className="table-responsive" style={{ minHeight: "350px" }} style={{ minHeight: '300px' }}>
            <table className="table table-hover mb-0">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Linked Teacher Guide</th>
                  <th>Description</th>
                  <th>Created At</th>
                  <th className="text-end">Action</th>
                </tr>
              </thead>
              <tbody>
                {paginated.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-4">
                      No read & write items found.
                    </td>
                  </tr>
                ) : (
                  paginated.map((row) => {
                    const titleTxt = row?.paperTytle || row?.title || '-';
                    const tg =
                      typeof row?.teacherguideId === 'string'
                        ? { _id: row.teacherguideId, coureInfo: row.teacherguideId }
                        : row?.teacherguideId || null;
                    const createdAt = row?.createdAt
                      ? new Date(row.createdAt).toLocaleString()
                      : '-';
                    const desc = row?.Description || '';

                    return (
                      <tr key={row._id}>
                        <td
                          style={{
                            minWidth: '220px',
                            maxWidth: '320px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                          title={titleTxt}
                        >
                          {titleTxt}
                        </td>

                        <td
                          style={{
                            minWidth: '160px',
                            maxWidth: '240px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                          title={tg?.coureInfo || '-'}
                        >
                          {tg?.coureInfo || '-'}
                        </td>

                        <td
                          style={{
                            minWidth: '260px',
                            maxWidth: '520px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                          title={desc}
                        >
                          {desc || '-'}
                        </td>

                        <td>{createdAt}</td>

                        <td className="text-end">
                          <Dropdown
                            dropdownItems={getDropdownItems(row)}
                            triggerClass="avatar-md ms-auto"
                            triggerPosition="0,28"
                          />
                        </td>
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
                onClick={() =>
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                }
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

export default ReadAndWriteTable;

