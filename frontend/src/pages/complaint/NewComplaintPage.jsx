import ComplaintForm from '../../components/complaints/ComplaintForm';

const NewComplaintPage = () => (
  <div className="min-h-[calc(100vh-80px)] bg-bg-secondary p-4 md:p-8 xl:p-12">
    <div className="max-w-[1200px] mx-auto">
      <div className="rounded-[24px] border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-extrabold text-text-primary mb-3">Submit a new complaint</h1>
        <p className="text-text-secondary mb-6">Complete the complaint form and our team will review the case with priority.</p>
        <ComplaintForm />
      </div>
    </div>
  </div>
);

export default NewComplaintPage;
