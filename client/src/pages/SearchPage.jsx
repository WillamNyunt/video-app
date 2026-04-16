import { useEffect, useState, useCallback } from 'react';
import { Search, UserCircle, Film } from 'lucide-react';
import { search } from '../api/search';
import { getSchema } from '../api/attributeSchema';
import VideoCard from '../components/VideoCard';
import { Link } from 'react-router-dom';
import './SearchPage.css';

function debounce(fn, delay) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), delay);
  };
}

export default function SearchPage() {
  const [schema, setSchema] = useState([]);
  const [schemaLoading, setSchemaLoading] = useState(true);

  const [query, setQuery] = useState('');
  const [filters, setFilters] = useState({});
  const [results, setResults] = useState(null); // null = not searched yet
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState('');

  useEffect(() => {
    getSchema()
      .then((data) => {
        const sorted = data.sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
        setSchema(sorted);
      })
      .catch(() => {})
      .finally(() => setSchemaLoading(false));
  }, []);

  const doSearch = useCallback(
    debounce(async (q, f) => {
      setSearching(true);
      setSearchError('');
      try {
        const data = await search(q, f);
        setResults(data);
      } catch (err) {
        setSearchError(err.message);
      } finally {
        setSearching(false);
      }
    }, 400),
    []
  );

  function handleQueryChange(e) {
    const q = e.target.value;
    setQuery(q);
    doSearch(q, filters);
  }

  function handleFilterChange(label, value) {
    const newFilters = { ...filters };
    if (value === '' || value === false || value === null || value === undefined) {
      delete newFilters[label];
    } else {
      newFilters[label] = value;
    }
    setFilters(newFilters);
    doSearch(query, newFilters);
  }

  function handleSubmit(e) {
    e.preventDefault();
    doSearch.cancel?.();
    setSearching(true);
    setSearchError('');
    search(query, filters)
      .then((data) => setResults(data))
      .catch((err) => setSearchError(err.message))
      .finally(() => setSearching(false));
  }

  const people = results?.people || [];
  const videos = results?.videos || [];
  const hasResults = results !== null;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">
          <Search size={20} />
          Search
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="search-form">
        <div className="search-bar">
          <Search size={16} className="search-bar__icon" />
          <input
            type="text"
            className="form-input search-bar__input"
            placeholder="Search by person name..."
            value={query}
            onChange={handleQueryChange}
            autoFocus
          />
          <button type="submit" className="btn btn-primary search-bar__btn">
            Search
          </button>
        </div>

        {!schemaLoading && schema.length > 0 && (
          <div className="search-filters">
            <span className="search-filters__label">Filters:</span>
            {schema.map((s) => (
              <div key={s._id} className="search-filter-item">
                <label className="search-filter-label">{s.label}</label>

                {s.type === 'dropdown' && (
                  <select
                    className="form-select search-filter-select"
                    value={filters[s.label] || ''}
                    onChange={(e) => handleFilterChange(s.label, e.target.value)}
                  >
                    <option value="">Any</option>
                    {(s.options?.items || []).map((item) => (
                      <option key={item} value={item}>{item}</option>
                    ))}
                  </select>
                )}

                {s.type === 'checkbox' && (
                  <label className="search-filter-checkbox">
                    <input
                      type="checkbox"
                      checked={!!filters[s.label]}
                      onChange={(e) => handleFilterChange(s.label, e.target.checked || undefined)}
                    />
                    Yes
                  </label>
                )}

                {s.type === 'slider' && (
                  <div className="search-filter-slider">
                    <input
                      type="range"
                      min={s.options?.min ?? 0}
                      max={s.options?.max ?? 100}
                      step={s.options?.step ?? 1}
                      value={filters[s.label] ?? s.options?.min ?? 0}
                      onChange={(e) => handleFilterChange(s.label, Number(e.target.value))}
                      style={{ accentColor: 'var(--color-accent)' }}
                    />
                    <span className="search-filter-slider-val">
                      {filters[s.label] ?? s.options?.min ?? 0}
                    </span>
                    <button
                      type="button"
                      className="btn btn-ghost"
                      style={{ fontSize: 11, padding: '2px 6px' }}
                      onClick={() => handleFilterChange(s.label, undefined)}
                    >
                      Reset
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </form>

      {searchError && <p className="error-message" style={{ marginBottom: 16 }}>{searchError}</p>}

      {searching && <div className="spinner" aria-label="Searching" />}

      {!searching && hasResults && (
        <div className="search-results">
          {people.length === 0 && videos.length === 0 && (
            <p className="empty-state">No results found.</p>
          )}

          {people.length > 0 && (
            <section className="search-section">
              <h2 className="search-section-title">
                <UserCircle size={16} />
                People ({people.length})
              </h2>
              <div className="search-people-list">
                {people.map((p) => (
                  <Link key={p._id} to={`/people/${p._id}`} className="search-person-row">
                    <UserCircle size={20} className="search-person-icon" />
                    <span className="search-person-name">{p.name}</span>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {videos.length > 0 && (
            <section className="search-section">
              <h2 className="search-section-title">
                <Film size={16} />
                Videos ({videos.length})
              </h2>
              <div className="card-grid">
                {videos.map((v) => (
                  <VideoCard key={v._id} video={v} isAdmin={false} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
