import ProfileForm from "./profile-form";

export default async function Profile() {
  return (
    <>
      <ProfileForm />
      <div id="recaptcha-container" className="opacity-0" />
    </>
  );
}
