import React, { useState, useEffect } from 'react';
import CardHeader from '@/components/shared/CardHeader';
import CardLoader from '@/components/shared/CardLoader';
import useCardTitleActions from '@/hooks/useCardTitleActions';
import axios from 'axios';
import BASE_URL from '../../config/apiConfig';
import { getToken } from '@/utils/token';
import Swal from 'sweetalert2';

const MAX_PDFS = 5;

const AddMathsLectureForm = ({ title }) => {
  const selectTextStyle = {
    fontFamily: 'inherit',
    fontSize: '14px',
    fontWeight: 500,
    color: '#283c50',
  };

  const [formData, setFormData] = useState({
    lectureType: '1',          // 1=full, 2=video only, 3=pdf only
    lectureTytle: '',
    lectureDifficulty: '',
    grade: 3,
    score: 100,
    teacherGuideId: '',
    description: '',
  });



  const [videoFile, setVideoFile] = useState(null);
  const [videoPreview, setVideoPreview] = useState('');

  const [pdfFiles, setPdfFiles] = useState([]);          // File[]
  const [pdfPreviews, setPdfPreviews] = useState([]);    // [{url, name}]

  const [teacherGuides, setTeacherGuides] = useState([]); // fetched list
  const [tgLoading, setTgLoading] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    refreshKey,
    isRemoved,
    isExpanded,
    handleRefresh,
    handleExpand,
    handleDelete,
  } = useCardTitleActions();

  // Fetch teacher guides once
  useEffect(() => {
    const loadTeacherGuides = async () => {
      try {
        setTgLoading(true);
        const token = getToken();
        const res = await axios.get(`${BASE_URL}/teacher-guides`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setTeacherGuides(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error('Failed to load teacher guides', err);
        Swal.fire('Error', 'Failed to load teacher guides.', 'error');
      } finally {
        setTgLoading(false);
      }
    };
    loadTeacherGuides();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Cleanup object URLs
  useEffect(() => {
    return () => {
      if (videoPreview) URL.revokeObjectURL(videoPreview);
      pdfPreviews.forEach((p) => URL.revokeObjectURL(p.url));
    };
  }, [videoPreview, pdfPreviews]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };



  const handleVideoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (videoPreview) URL.revokeObjectURL(videoPreview); // Clean previous preview
    const url = URL.createObjectURL(file);
    setVideoFile(file);
    setVideoPreview(url);
  };

  const handlePdfChange = (e) => {
    const picked = Array.from(e.target.files || []);
    if (!picked.length) return;

    // PDFs only
    const onlyPdfs = picked.filter((f) => f.type === 'application/pdf');
    if (onlyPdfs.length !== picked.length) {
      Swal.fire('Notice', 'Only PDF files are allowed for materials.', 'info');
    }

    // Merge with existing and enforce max
    const combined = [...pdfFiles, ...onlyPdfs];
    if (combined.length > MAX_PDFS) {
      Swal.fire('Limit reached', `You can attach up to ${MAX_PDFS} PDFs. Extra files were ignored.`, 'warning');
    }
    const limited = combined.slice(0, MAX_PDFS);

    // Rebuild previews (revoke old first)
    pdfPreviews.forEach((p) => URL.revokeObjectURL(p.url));
    const previews = limited.map((f) => ({ url: URL.createObjectURL(f), name: f.name }));

    setPdfFiles(limited);
    setPdfPreviews(previews);
  };

  const removePdfAt = (idx) => {
    const newFiles = pdfFiles.filter((_, i) => i !== idx);
    const removeUrl = pdfPreviews[idx]?.url;
    if (removeUrl) URL.revokeObjectURL(removeUrl);
    const newPreviews = pdfPreviews.filter((_, i) => i !== idx);
    setPdfFiles(newFiles);
    setPdfPreviews(newPreviews);
  };

  const clearVideo = () => {
    if (videoPreview) URL.revokeObjectURL(videoPreview);
    setVideoFile(null);
    setVideoPreview('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (pdfFiles.length > MAX_PDFS) {
      Swal.fire('Limit reached', `You can attach up to ${MAX_PDFS} PDF materials only.`, 'warning');
      return;
    }

    try {
      setIsSubmitting(true);
      const token = getToken();
      const fd = new FormData();

      fd.append('lectureType', formData.lectureType || '');
      fd.append('lectureTytle', formData.lectureTytle || '');
      fd.append('lectureDifficulty', formData.lectureDifficulty || '');
      fd.append('grade', formData.grade || 3);
      fd.append('score', formData.score || 100);
      if (formData.teacherGuideId) fd.append('teacherGuideId', formData.teacherGuideId);
      fd.append('description', formData.description || '');

      if (videoFile) fd.append('video', videoFile);
      pdfFiles.forEach((f) => fd.append('pdfMaterials', f));

      await axios.post(`${BASE_URL}/maths/video-lectures`, fd, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      await Swal.fire({
        icon: 'success',
        title: 'Lecture added!',
        text: 'Maths video lecture was created successfully.',
        timer: 1700,
        showConfirmButton: false,
      });

      setFormData({
        lectureType: '1',
        lectureTytle: '',
        lectureDifficulty: '',
        grade: 3,
        score: 100,
        teacherGuideId: '',
        description: '',
      });

      clearVideo();
      pdfPreviews.forEach((p) => URL.revokeObjectURL(p.url));
      setPdfFiles([]);
      setPdfPreviews([]);
      handleRefresh();
    } catch (err) {
      console.error('Video lecture submission failed:', err?.response?.data || err);
      Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text:
          err?.response?.data?.message ||
          err?.response?.data?.error ||
          'Failed to add Maths video lecture.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isRemoved) return null;

  return (
    <div className="col-xxl-12">
      <div className={`card stretch stretch-full ${isExpanded ? 'card-expand' : ''} ${refreshKey ? 'card-loading' : ''}`}>
        <CardHeader title={title} refresh={handleRefresh} remove={handleDelete} expanded={handleExpand} />

        <form onSubmit={handleSubmit}>
          <div className="card-body">
            <div className="row g-3">
              {/* Lecture Type (1,2,3 with labels) */}
              <div className="col-md-4">
                <label className="form-label">Lecture Type</label>
                <select
                  className="form-select"
                  name="lectureType"
                  value={formData.lectureType}
                  onChange={handleChange}
                  style={selectTextStyle}
                  required
                >
                  <option style={selectTextStyle} value="1">1 - Full content (Video + PDFs)</option>
                  <option style={selectTextStyle} value="2">2 - Video only</option>
                  <option style={selectTextStyle} value="3">3 - PDF only</option>
                </select>
                <small className="text-muted">Choose what kind of content you’re uploading.</small>
              </div>

              <div className="col-md-4">
                <label className="form-label">Lecture Title</label>
                <input
                  type="text"
                  className="form-control"
                  name="lectureTytle" // API key is 'lectureTytle'
                  value={formData.lectureTytle}
                  onChange={handleChange}
                  placeholder="Intro to Maths"
                  required
                />
              </div>

              <div className="col-md-4">
                <label className="form-label">Difficulty</label>
                <input
                  type="text"
                  className="form-control"
                  name="lectureDifficulty"
                  value={formData.lectureDifficulty}
                  onChange={handleChange}
                  placeholder="Easy / Medium / Hard"
                  required
                />
              </div>

              <div className="col-md-4">
                <label className="form-label">Grade</label>
                <input
                  type="number"
                  min="1"
                  max="13"
                  className="form-control"
                  name="grade"
                  value={formData.grade}
                  onChange={handleChange}
                  placeholder="e.g. 3"
                  required
                />
              </div>

              <div className="col-md-4">
                <label className="form-label">Lecture Score</label>
                <input
                  type="number"
                  min="0"
                  className="form-control"
                  name="score"
                  value={formData.score}
                  onChange={handleChange}
                  placeholder="e.g. 100"
                  required
                />
              </div>

              {/* Teacher Guide selector (from /teacher-guides) */}
              <div className="col-md-4">
                <label className="form-label">Teacher Guide (optional)</label>
                <select
                  className="form-select"
                  name="teacherGuideId"
                  value={formData.teacherGuideId}
                  onChange={handleChange}
                  style={selectTextStyle}
                  disabled={tgLoading}
                >
                  <option style={selectTextStyle} value="">None</option>
                  {teacherGuides.map((tg) => (
                    <option style={selectTextStyle} key={tg._id} value={tg._id}>
                      {tg.coureInfo}
                    </option>
                  ))}
                </select>
                <small className="text-muted">
                  {tgLoading ? 'Loading teacher guides…' : 'Link this lecture to an existing teacher guide (optional).'}
                </small>
              </div>

              <div className="col-12">
                <label className="form-label">Description</label>
                <textarea
                  className="form-control"
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="This is an introduction to Maths basics..."
                  rows={6}
                  required
                />
              </div>



              {/* Video picker + small preview */}
              <div className="col-md-6">
                <label className="form-label d-flex justify-content-between">
                  <span>Video</span>
                  {videoPreview ? (
                    <button type="button" className="btn btn-link p-0 small" onClick={clearVideo}>
                      Remove
                    </button>
                  ) : null}
                </label>
                <input type="file" className="form-control" accept="video/*" onChange={handleVideoChange} />
                {videoPreview && (
                  <div className="mt-2">
                    <video src={videoPreview} controls style={{ width: 260, height: 150, borderRadius: 6 }} />
                  </div>
                )}
              </div>

              {/* PDFs picker + small previews (max 5) */}
              <div className="col-md-6">
                <label className="form-label d-flex justify-content-between">
                  <span>PDF Materials (max {MAX_PDFS})</span>
                  <span className="small text-muted">
                    {pdfFiles.length}/{MAX_PDFS}
                  </span>
                </label>
                <input type="file" className="form-control" accept="application/pdf" multiple onChange={handlePdfChange} />
                {pdfPreviews.length > 0 && (
                  <div className="mt-2 d-flex flex-wrap gap-2">
                    {pdfPreviews.map((p, idx) => (
                      <div key={idx} className="border rounded p-1" style={{ width: 130 }}>
                        <iframe
                          src={p.url}
                          title={`pdf-${idx}`}
                          style={{ width: '100%', height: 150, border: 'none', borderRadius: 4 }}
                        />
                        <div className="d-flex align-items-center justify-content-between mt-1">
                          <small className="text-truncate" title={p.name} style={{ maxWidth: 90 }}>
                            {p.name}
                          </small>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => removePdfAt(idx)}
                            title="Remove"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="card-footer d-flex justify-content-end">
            <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Lecture'}
            </button>
          </div>
        </form>

        <CardLoader refreshKey={refreshKey} />
      </div>
    </div>
  );
};

export default AddMathsLectureForm;
