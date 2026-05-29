'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { triggerUptimeCheck } from '@/app/actions';

export default function RefreshButton() {
  const [loading, setLoading] = useState(false);

  const handleRefresh = async () => {
    setLoading(true);
    try {
      await triggerUptimeCheck();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      onClick={handleRefresh}
      disabled={loading}
      className="font-semibold shadow-sm transition-all duration-300"
    >
      <RefreshCw className={`mr-1.5 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
      {loading ? 'Checking...' : 'Check All Now'}
    </Button>
  );
}
