import React, { useEffect, useState, useRef } from "react";
import RequestCard from "../components/RequestCard";
import NewRequestForm from "../components/NewRequestForm";

function OrganRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit] = useState(8);
  const [total, setTotal] = useState(0);
  const [organFilter, setOrganFilter] = useState('');
  const [urgencyFilter, setUrgencyFilter] = useState('');
  const [q, setQ] = useState('');
  const [sort, setSort] = useState('-id');
  const searchTimer = useRef();

  // Initial load and subsequent refetches are handled by the effect below

  // refetch when filters or page change
  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set('page', page);
    params.set('limit', limit);
    if (organFilter) params.set('organ', organFilter);
    if (urgencyFilter) params.set('urgency', urgencyFilter);
    if (q) params.set('q', q);
    if (sort) params.set('sort', sort);

    fetch(`/api/requests?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        setRequests(data.items || []);
        setTotal(data.total || 0);
      })
      .catch((err) => console.error("Failed to load requests", err))
      .finally(() => setLoading(false));
  }, [page, limit, organFilter, urgencyFilter, q, sort]);

  const [showForm, setShowForm] = useState(false);

  function handleCreated(item) {
    // refresh list to reflect new item (could match filters)
    setPage(1);
    setQ('');
    setOrganFilter('');
    setUrgencyFilter('');
    // prepend locally for immediate feedback
    setRequests((s) => [item, ...s]);
    setTotal((t) => t + 1);
  }

  async function handleView(id) {
    try {
      const res = await fetch(`/api/requests/${id}`);
      if (!res.ok) throw new Error('not found');
      const data = await res.json();
      alert(JSON.stringify(data, null, 2));
    } catch (err) {
      alert('Failed to load details');
    }
  }

  async function handleResolve(id) {
    try {
      const res = await fetch(`/api/requests/${id}`, { method: 'DELETE' });
      if (res.status === 204) {
        setRequests((s) => s.filter((r) => r.id !== id));
        setTotal((t) => Math.max(0, t - 1));
      } else {
        throw new Error('delete failed');
      }
    } catch (err) {
      alert('Failed to resolve request');
    }
  }

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h2>Active Organ Requests</h2>
          <p>Location-based emergency organ coordination</p>
        </div>
        <div>
          <button className="btn btn-primary" onClick={() => setShowForm((v) => !v)}>{showForm ? 'Close' : '+ New Request'}</button>
        </div>
      </div>

      {showForm && <NewRequestForm onClose={() => setShowForm(false)} onCreated={handleCreated} />}

      {/* Filters */}
      <div style={styles.filters}>
        <select value={organFilter} onChange={(e) => { setOrganFilter(e.target.value); setPage(1); }}>
          <option value="">All Organs</option>
          <option>Kidney</option>
          <option>Liver</option>
        </select>

        <select value={urgencyFilter} onChange={(e) => { setUrgencyFilter(e.target.value); setPage(1); }}>
          <option value="">All Urgency Levels</option>
          <option>Critical</option>
          <option>High</option>
          <option>Moderate</option>
        </select>

        <input placeholder="Search city or area..." value={q} onChange={(e) => { clearTimeout(searchTimer.current); const v = e.target.value; searchTimer.current = setTimeout(() => { setQ(v); setPage(1); }, 400); }} />

        <select value={sort} onChange={(e) => { setSort(e.target.value); setPage(1); }}>
          <option value="-id">Newest</option>
          <option value="id">Oldest</option>
          <option value="urgency">Urgency</option>
        </select>
      </div>

      {/* Cards */}
      {loading ? (
        <p>Loading...</p>
      ) : requests.length ? (
        <>
          {requests.map((req) => <RequestCard key={req.id} data={req} onView={handleView} onResolve={handleResolve} />)}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
            <div>Showing {requests.length} of {total}</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-outline" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>Prev</button>
              <div style={{ alignSelf: 'center' }}>Page {page}</div>
              <button className="btn btn-outline" onClick={() => setPage((p) => p + 1)} disabled={page * limit >= total}>Next</button>
            </div>
          </div>
        </>
      ) : (
        <p>No results found</p>
      )}
    </div>
  );
}

const styles = {
  filters: {
    display: "flex",
    gap: 16,
    margin: "20px 0",
  },
};

export default OrganRequests;
