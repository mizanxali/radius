import { useMyProfile } from '../profile';
import { GradientButton } from '../ui';
import { G } from '../theme';
import { ProfileView } from './Person';

export default function Me({ onEdit }: { onEdit: () => void }) {
  const [me] = useMyProfile();
  return (
    <ProfileView
      profile={me}
      status="you"
      actions={<GradientButton title="Edit profile" colors={G.cool} onPress={onEdit} />}
    />
  );
}
