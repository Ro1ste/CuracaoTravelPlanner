import { EventRegistrationForm } from '../EventRegistrationForm';

export default function EventRegistrationFormExample() {
  const handleSubmit = (data: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  }) => {
    console.log('Registration submitted:', data);
  };

  return (
    <div className="p-4">
      <EventRegistrationForm
        eventTitle="Corporate Wellness Summit 2024"
        eventDescription="Join us for an inspiring day of wellness workshops, networking, and team building activities."
        onSubmit={handleSubmit}
        isSubmitting={false}
      />
    </div>
  );
}