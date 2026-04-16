import { Link } from 'react-router-dom';
import './PersonChip.css';

export default function PersonChip({ person }) {
  return (
    <Link to={`/people/${person._id}`} className="person-chip">
      {person.name}
    </Link>
  );
}
