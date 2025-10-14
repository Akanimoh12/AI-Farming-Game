import { useAccount, useDisconnect } from 'wagmi'
import { Copy, ExternalLink, LogOut } from 'lucide-react'
import { Button, Card } from '@components/common'
import { showSuccessToast } from '@stores/uiStore'

export function AccountInfo() {
  const { address, chain } = useAccount()
  const { disconnect } = useDisconnect()

  const copyAddress = () => {
    if (address) {
      navigator.clipboard.writeText(address)
      showSuccessToast('Copied!', 'Address copied to clipboard')
    }
  }

  const viewOnExplorer = () => {
    if (address && chain?.blockExplorers) {
      const explorerUrl = `${chain.blockExplorers.default.url}/address/${address}`
      window.open(explorerUrl, '_blank', 'noopener,noreferrer')
    }
  }

  if (!address) return null

  return (
    <Card padding="md">
      <div className="space-y-4">
        <div>
          <label className="text-sm text-gray-400">Wallet Address</label>
          <div className="flex items-center gap-2 mt-1">
            <code className="flex-1 text-sm bg-dark-100 px-3 py-2 rounded font-mono">
              {address}
            </code>
            <Button
              variant="ghost"
              size="sm"
              icon={<Copy />}
              onClick={copyAddress}
              aria-label="Copy address"
            >
              <span className="sr-only">Copy</span>
            </Button>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            icon={<ExternalLink />}
            onClick={viewOnExplorer}
            fullWidth
          >
            View on Explorer
          </Button>
          <Button
            variant="ghost"
            size="sm"
            icon={<LogOut />}
            onClick={() => disconnect()}
            fullWidth
          >
            Disconnect
          </Button>
        </div>
      </div>
    </Card>
  )
}
