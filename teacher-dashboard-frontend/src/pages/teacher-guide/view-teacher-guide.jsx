import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import PageHeader from '@/components/shared/pageHeader/PageHeader';
import CardHeader from '@/components/shared/CardHeader';
import BASE_URL from '../../config/apiConfig';
import { getToken } from '@/utils/token';
import { BsArrowLeft } from 'react-icons/bs';

const ViewTeacherGuide = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [guide, setGuide] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGuide = async () => {
      try {
        const token = getToken();
        const { data } = await axios.get(`${BASE_URL}/teacher-guides/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setGuide(data);
      } catch (error) {
        console.error('Failed to load teacher guide', error);
        setGuide(null);
      } finally {
        setLoading(false);
      }
    };

    fetchGuide();
  }, [id]);

  const createdBy = guide?.createBy?.username || guide?.createBy?.email || '-';
  const createdAt = guide?.createdAt ? new Date(guide.createdAt).toLocaleString() : '-';
  const studyTime = Number.isFinite(Number(guide?.studytime)) ? `${Math.round(Number(guide.studytime))} minutes` : '-';

  return (
    <>
      <PageHeader />
      <div className="main-content">
        <div className="row">
          <div className="col-12">
            <div className="card stretch stretch-full">
              <CardHeader title="Teacher Guide Details" />
              <div className="card-body">
                <div className="d-flex justify-content-end mb-4">
                  <button type="button" className="btn btn-light btn-sm" onClick={() => navigate(-1)}>
                    <BsArrowLeft className="me-2" /> Back to List
                  </button>
                </div>

                {loading ? (
                  <div className="text-center py-5">Loading teacher guide...</div>
                ) : !guide ? (
                  <div className="text-center py-5">
                    <h5 className="mb-1">Teacher guide not found.</h5>
                    <p className="text-muted mb-0">Please go back and try again.</p>
                  </div>
                ) : (
                  <>
                    <div className="row g-3 mb-4">
                      <div className="col-md-6">
                        <div className="border rounded-3 p-3 h-100">
                          <div className="text-muted small mb-1">Course Info</div>
                          <div className="fw-semibold text-dark">{guide.coureInfo || '-'}</div>
                        </div>
                      </div>
                      <div className="col-md-3">
                        <div className="border rounded-3 p-3 h-100">
                          <div className="text-muted small mb-1">Study Time</div>
                          <div className="fw-semibold text-dark">{studyTime}</div>
                        </div>
                      </div>
                      <div className="col-md-3">
                        <div className="border rounded-3 p-3 h-100">
                          <div className="text-muted small mb-1">Created At</div>
                          <div className="fw-semibold text-dark">{createdAt}</div>
                        </div>
                      </div>
                      <div className="col-12">
                        <div className="border rounded-3 p-3">
                          <div className="text-muted small mb-1">Created By</div>
                          <div className="fw-semibold text-dark">{createdBy}</div>
                        </div>
                      </div>
                    </div>

                    <div className="border rounded-3 bg-white">
                      <div className="px-4 py-3 border-bottom">
                        <h5 className="mb-0">Full Teacher Guide</h5>
                      </div>
                      <div
                        className="p-4 text-dark"
                        style={{
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word',
                          lineHeight: 1.8,
                          fontSize: 15,
                        }}
                      >
                        {guide.originalTeacherGuide || 'No guide content available.'}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ViewTeacherGuide;
