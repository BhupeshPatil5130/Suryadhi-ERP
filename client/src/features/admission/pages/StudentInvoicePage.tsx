import { useParams, useNavigate } from 'react-router-dom';
import StudentInvoiceViewer from '../components/StudentInvoiceViewer';

export default function StudentInvoicePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  return (
    <StudentInvoiceViewer
      admissionId={id}
      onBack={() => navigate('/admission')}
    />
  );
}
