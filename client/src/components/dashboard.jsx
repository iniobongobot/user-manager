import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Trash2, Edit3, Plus, ChevronLeft, ChevronRight, Search } from 'lucide-react';

const API_BASE = "http://localhost:3000/api/v1/users";

const UserManager = () => {
    const [users, setUsers] = useState([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);
    
    // Query & Pagination State
    const [queryParams, setQueryParams] = useState({
        page: 1,
        limit: 10,
        searchKey: 'first_name',
        searchValue: '',
        sort: 'first_name',
        order: 'asc'
    });

    // Modal State
    const [showModal, setShowModal] = useState(false);
    const [editingUser, setEditingUser] = useState(null); 
    const [formData, setFormData] = useState({ first_name: '', last_name: '', email: '', gender: '', status: 'Active' });

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const requestParams = { ...queryParams };

            // 2. "Clean" the object: If there's no search value, remove the search keys
            if (!requestParams.searchValue || requestParams.searchValue.trim() === "") {
                delete requestParams.searchKey;
                delete requestParams.searchValue;
            }
            const res = await axios.get(API_BASE, { params: requestParams });
            setUsers(res.data.data);
            setTotal(res.data.total);
        } catch (err) {
            console.error("API Error:", err.response?.data || err.message);
        } finally {
            setLoading(false);
        }
    }, [queryParams]);

    useEffect(() => { fetchUsers(); }, [fetchUsers]);

    // This will handle updating the user record, PUT
    const handleAction = async (e) => {
        e.preventDefault();
        try {
            if (editingUser) {
                const { id, requestHash, ...updateData } = formData; 
                console.log(requestHash)
                await axios.put(`${API_BASE}/${id}`, updateData);
            } else {
                await axios.post(API_BASE, formData);
            }
            setShowModal(false);
            setFormData({ first_name: '', last_name: '', email: '', gender: '', status: 'Active' });
            fetchUsers();
        } catch (err) {
            console.log(formData)
            console.log(err.response.data.message)
            alert(err.response?.data?.message|| "Operation failed");
        }
    };

    const deleteUser = async (id) => {
        if (!window.confirm("Delete this user?")) return;
        await axios.delete(`${API_BASE}/${id}`);
        fetchUsers();
    };

    const openEdit = (user) => {
        setEditingUser(user);
        setFormData({ ...user });
        setShowModal(true);
    };

    return (
<div className="container py-5">
    {/* Header & Search Bar */}
    <div className="d-flex flex-column flex-md-row justify-content-between align-items-center mb-4 gap-3">
        <div className="input-group w-auto shadow-sm">
            <span className="input-group-text bg-white"><Search size={18} /></span>
            <select 
                className="form-select border-start-0"
                style={{ width: 'auto' }}
                value={queryParams.searchKey}
                onChange={(e) => setQueryParams({...queryParams, searchKey: e.target.value, page: 1})}
            >
                <option value="first_name">FirstName</option>
                <option value="last_name">LastName</option>
                <option value="email">Email</option>
                <option value="gender">Gender</option>
                <option value="status">Status</option>
            </select>
            <input 
                type="text"
                className="form-control"
                placeholder="Search users..."
                onChange={(e) => setQueryParams({...queryParams, searchValue: e.target.value, page: 1})}
            />
        </div>
        
        <button 
            onClick={() => { 
                console.log("Button clicked"); 
                setEditingUser(null); 
                setFormData({ first_name: '', last_name: '', email: '', gender: '', status: 'Active' });
                setShowModal(true); }}
            className="btn btn-primary d-flex align-items-center gap-2 shadow-sm"
        >
            <Plus size={18} /> New User
        </button>
    </div>

    {/* Table Card */}
    <div className="card shadow-sm border-0">
        <div className="table-responsive">
            <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                    <tr>
                        {['first_name', 'last_name', 'email', 'gender', 'status'].map(key => (
                            <th 
                                key={key} 
                                className="px-4 py-3 text-uppercase fs-7 fw-bold text-muted cursor-pointer"
                                onClick={() => setQueryParams({...queryParams, sort: key, order: queryParams.order === 'asc' ? 'desc' : 'asc'})}
                            >
                                {key.replace('_', ' ')} 
                                <span className="ms-1 text-primary">
                                    {queryParams.sort === key && (queryParams.order === 'asc' ? '↑' : '↓')}
                                </span>
                            </th>
                        ))}
                        <th className="px-4 text-end">Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {loading ? (
                        <tr><td colSpan="5" className="text-center py-5 text-muted">Loading user data...</td></tr>
                    ) : (
                        users.map(user => (
                            <tr key={user.id}>
                                <td className="px-4 fw-bold">{user.first_name}</td>
                                <td className="px-4 fw-bold">{user.last_name}</td>
                                <td className="px-4"><code className="text-muted">{user.email}</code></td>
                                <td className="px-4 text-secondary">{user.gender}</td>
                                <td className="px-4">
                                    <span className={`badge ${
                                        user.status === 'Active' ? 'bg-success-subtle text-success border border-success' : 
                                        user.status === 'Inactive' ? 'bg-warning-subtle text-warning-emphasis border border-warning' : 
                                        'bg-danger-subtle text-danger border border-danger'
                                    } rounded-pill px-3`}>
                                        {user.status}
                                    </span>
                                </td>
                                <td className="px-4 text-end">
                                    <button onClick={() => openEdit(user)} className="btn btn-link text-primary p-1"><Edit3 size={18}/></button>
                                    <button onClick={() => deleteUser(user.id)} className="btn btn-link text-danger p-1"><Trash2 size={18}/></button>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
        
        {/* Pagination Footer */}
        <div className="card-footer bg-white py-3 d-flex justify-content-between align-items-center">
            <div className="d-flex align-items-center gap-3">
                <small className="text-muted">Total: {total}</small>
                <select className="form-select form-select-sm w-auto" value={queryParams.limit} onChange={e => setQueryParams({...queryParams, limit: e.target.value, page: 1})}>
                    <option value="10">10 / page</option>
                    <option value="25">25 / page</option>
                    <option value="50">50 / page</option>
                </select>
            </div>
            <nav>
                <ul className="pagination pagination-sm mb-0">
                    <li className={`page-item ${queryParams.page === 1 ? 'disabled' : ''}`}>
                        <button className="page-link" onClick={() => setQueryParams({...queryParams, page: queryParams.page - 1})}><ChevronLeft size={16}/></button>
                    </li>
                    <li className="page-item disabled"><span className="page-link text-dark">Page {queryParams.page}</span></li>
                    <li className={`page-item ${queryParams.page * queryParams.limit >= total ? 'disabled' : ''}`}>
                        <button className="page-link" onClick={() => setQueryParams({...queryParams, page: queryParams.page + 1})}><ChevronRight size={16}/></button>
                    </li>
                </ul>
            </nav>
        </div>
    </div>
    {/* PLACE THIS AT THE BOTTOM OF YOUR MAIN DIV */}
    {showModal && (
        <div 
            className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" 
            style={{ background: 'rgba(0,0,0,0.6)', zIndex: 2000 }}
        >
            <div className="card shadow-lg border-0 w-100 mx-3" style={{ maxWidth: '450px' }}>
                <form onSubmit={handleAction}>
                    <div className="card-header bg-white py-3 border-0">
                        <h5 className="mb-0 fw-bold">{editingUser ? 'Edit User' : 'Add New User'}</h5>
                    </div>
                    
                    <div className="card-body px-4">
                        <div className="mb-3">
                            <label className="form-label small text-muted">FirstName</label>
                            <input 
                                className="form-control" 
                                placeholder="e.g. Jane"
                                required 
                                value={formData.first_name} 
                                onChange={e => setFormData({...formData, first_name: e.target.value})}
                            />
                        </div>
                        
                        <div className="mb-3">
                            <label className="form-label small text-muted">LastName</label>
                            <input 
                                className="form-control" 
                                placeholder="Hall"
                                required 
                                value={formData.last_name} 
                                onChange={e => setFormData({...formData, last_name: e.target.value})}
                            />
                        </div>
                        
                        <div className="row g-3">
                            <div className="col-md-6">
                                <label className="form-label small text-muted">Email</label>
                                <input 
                                    className="form-control" 
                                    placeholder="jhall@sas.com"
                                    type="email" 
                                    required 
                                    value={formData.email} 
                                    onChange={e => setFormData({...formData, email: e.target.value})}
                                />
                            </div>
                            <div className="col-md-6">
                                <label className="form-label small text-muted">Gender</label>
                                <select 
                                    className="form-select" 
                                    required 
                                    value={formData.gender} 
                                    onChange={e => setFormData({...formData, gender: e.target.value})}
                                >
                                    <option value="">Select Gender</option>
                                    <option value="Male">       Male</option>
                                    <option value="Female">     Female</option>
                                    <option value="Non-Binary">Non-Binary</option>
                                </select>   
                            </div>
                            <div className="col-md-6">
                                <label className="form-label small text-muted">Status</label>
                                <select 
                                    className="form-select" 
                                    value={formData.status} 
                                    onChange={e => setFormData({...formData, status: e.target.value})}
                                >
                                    <option value="Active">Active</option>
                                    <option value="Inactive">Inactive</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="card-footer bg-light p-3 d-flex justify-content-end gap-2 border-0">
                        <button 
                            type="button" 
                            className="btn btn-light border" 
                            onClick={() => setShowModal(false)}
                        >
                            Cancel
                        </button>
                        <button 
                            type="submit" 
                            className="btn btn-primary px-4"
                        >
                            {editingUser ? 'Save Changes' : 'Create User'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )}
    </div>
    );
};

export default UserManager;