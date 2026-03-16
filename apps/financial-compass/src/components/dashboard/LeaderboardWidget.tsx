import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Trophy, Medal, Award, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

interface LeaderboardEntry {
  display_name: string;
  avatar_url: string | null;
  converted_count: number;
  rank: number;
}

export function LeaderboardWidget() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const { data, error } = await supabase.rpc('get_referral_leaderboard', {
          limit_count: 5,
        });
        if (error) throw error;
        setEntries((data as LeaderboardEntry[]) || []);
      } catch (err) {
        console.error('Error fetching leaderboard:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, []);

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="h-4 w-4 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-4 w-4 text-gray-400" />;
    if (rank === 3) return <Award className="h-4 w-4 text-amber-600" />;
    return <span className="text-xs font-bold text-muted-foreground w-4 text-center">{rank}</span>;
  };

  return (
    <Card
      className="glass cursor-pointer hover:border-primary/30 transition-colors"
      onClick={() => navigate('/einstellungen?tab=billing')}
    >
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <Trophy className="h-4 w-4 text-yellow-500" />
          Top-Werber
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        ) : entries.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">
            Noch keine Empfehlungen — seien Sie der Erste!
          </p>
        ) : (
          <div className="space-y-2">
            {entries.map((entry) => (
              <div
                key={`${entry.rank}-${entry.display_name}`}
                className={cn(
                  'flex items-center gap-2 py-1.5 px-2 rounded-md text-xs',
                  entry.rank <= 3 && 'bg-muted/50'
                )}
              >
                <div className="w-5 flex justify-center shrink-0">
                  {getRankIcon(entry.rank)}
                </div>
                <Avatar className="h-5 w-5">
                  <AvatarImage src={entry.avatar_url || undefined} />
                  <AvatarFallback className="text-[8px]">
                    {entry.display_name.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="truncate flex-1">{entry.display_name}</span>
                <span className="font-semibold tabular-nums">{entry.converted_count}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
